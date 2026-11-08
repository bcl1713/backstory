"""Private whole-index graph evidence, without page or membership truncation.

The maintained index remains a derived, non-authoritative saved-content view.
Only metadata, canonical published relations and descriptor-safe stat checks are
read here. No request scans the vault or reads/parses note bodies.
"""
from dataclasses import asdict
import hashlib
import json

from django.utils import timezone
from django.utils.crypto import salted_hmac
from django.urls import reverse

from wiki.contracts import StorageError
from wiki.policy import validate_path
from wiki.storage import require_ready
from .graph import Query, _bounded, _filtered_nodes, _node_rows, _pairs, _path, _string
from .graph_contracts import GraphEdge, GraphNode, GraphPage
from .graph_projection import namespace_version
from .models import IndexGeneration, IndexedNote, LinkEdge, RelationState
from .scanner import file_stat


def authorization_scope(request):
    """Do not expose session credentials, account IDs or filesystem identities."""
    return _opaque('authorization', [str(request.user.pk), request.session.session_key,
                                     request.user.get_session_auth_hash()])


def _opaque(kind, value):
    return salted_hmac('graph-snapshot-v1:' + kind,
                       json.dumps(value, sort_keys=True, ensure_ascii=True),
                       algorithm='sha256').hexdigest()


def _eligible(context, row):
    context.examined += 1
    try:
        _path(row['path'])
        if file_stat(row['path']) == row['stat']:
            return GraphNode(row['path'], row['short_title'], row['revision'],
                             reverse('wiki:note', args=[row['path']]))
        context.reasons.add('changed_indexed_file')
    except (StorageError, OSError):
        context.reasons.add('eligibility_changed')
    context.complete = False
    return None


def _finish(context, scope, nodes, edges, boundary):
    from .worker import index_status
    current = index_status()
    if current.state == 'unavailable':
        context.complete = False
        context.reasons.add('storage_unavailable')
        nodes, edges, boundary = (), (), False
    else:
        require_ready()
        generation = IndexGeneration.objects.filter(state='active').first()
        relations = RelationState.objects.filter(generation=generation).first() if generation else None
        stamp = [generation.pk if generation else None, generation.mutation if generation else 0,
                 relations.epoch if relations else 0, namespace_version(),
                 bool(relations and relations.complete), bool(relations and relations.evidence_complete),
                 relations.publication if relations else 0]
        if stamp != context.stamp:
            # Never combine two publications, generations or storage policies.
            raise StorageError('graph_cursor_expired', 409)
        if current.state != 'ready':
            context.complete = False
            context.reasons.add('index_updating')
    page = GraphPage(
        state='unavailable' if current.state == 'unavailable' else 'ok' if context.complete else 'incomplete',
        freshness={'state': current.state, 'last_completed': current.last_completed,
                   'next_scheduled': current.next_scheduled,
                   'scope': 'indexed_saved_content_not_disk_snapshot'},
        generation=context.stamp[0], mutation=context.stamp[1], relation_epoch=context.stamp[2],
        eligibility_version=context.namespace, projection_complete=context.complete,
        observed_at=timezone.now().isoformat(),
        limits={'nodes': None, 'edges': None, 'examined_candidates': None,
                'payload_bytes': None},
        limiting_reasons=tuple(sorted(context.reasons)), next_cursor=None,
        nodes=tuple(nodes), edges=tuple(edges), boundary_connections=boundary)
    data = asdict(page)
    data.update(schema_version=1, scope=_opaque('scope', [scope, context.namespace]))
    # Observation time changes every request; evidence identity changes only
    # when its publication, scope, membership, counts or freshness changes.
    evidence = {key: value for key, value in data.items() if key != 'observed_at'}
    digest = hashlib.sha256(json.dumps(evidence, sort_keys=True, ensure_ascii=True).encode()).hexdigest()
    data['snapshot_id'] = _opaque('snapshot', [context.stamp, digest])
    return data


@_bounded
def query_snapshot(*, scope, folder='', tag='', query=''):
    """Return every eligible matching indexed note and its canonical edges.

    Legacy Query is used solely for publication/freshness initialization and
    canonical relation selection. Its page/candidate/payload cap helpers are
    deliberately never used by this bulk transport. SQL watchdog failures fail
    the request explicitly; they never return a supposedly complete prefix.
    """
    validate_path(folder, 'folder')
    _string(tag, 256, 'invalid_tag')
    _string(query, 256, 'invalid_search_query')
    _string(scope, 4096, 'invalid_arguments', empty=False)
    context = Query({'kind': 'snapshot', 'folder': folder, 'tag': tag, 'query': query}, None)
    if context.index.state == 'unavailable':
        return _finish(context, scope, (), (), False)
    try:
        rows = list(_node_rows(IndexedNote.objects.filter(generation=context.generation)).order_by('path'))
        indexed_paths = {row['path'] for row in rows}
        filtered = bool(folder or tag or query)
        matching = (set(_filtered_nodes(context.generation, folder, tag, query).values_list('path', flat=True))
                    if filtered else indexed_paths)
        # Aggregate the existing clean-source projection, preserving duplicate
        # occurrence counts and its earliest occurrence as advisory evidence.
        pairs = list(_pairs(context.relation_rows()))
        # Stat after collecting relation evidence and before the final stamp
        # check so an external edit with no queued event cannot retain old data.
        eligible = {}
        for row in rows:
            node = _eligible(context, row)
            if node:
                eligible[node.path] = node
        selected = {path: eligible[path] for path in matching if path in eligible}
        emitted = []
        boundary = False
        for pair in pairs:
            source, destination = pair['source'], pair['destination']
            if source not in eligible or destination not in eligible:
                # Missing metadata cannot support an endpoint or completeness.
                context.complete = False
                context.reasons.add('unindexed_endpoint' if source not in indexed_paths or destination not in indexed_paths else 'eligibility_changed')
                continue
            if source in selected and destination in selected:
                emitted.append(pair)
            elif filtered and (source in selected or destination in selected):
                boundary = True
        # Batches bound SQL parameter count only; every emitted pair is visited.
        samples = {}
        for start in range(0, len(emitted), 500):
            identifiers = [pair['first'] for pair in emitted[start:start + 500]]
            samples.update(LinkEdge.objects.filter(pk__in=identifiers).values_list('pk', 'position'))
        if any(pair['first'] not in samples for pair in emitted):
            raise StorageError('graph_cursor_expired', 409)
        edges = [GraphEdge(pair['source'], pair['destination'], pair['count'],
                           selected[pair['source']].revision, pair['first'], tuple(samples[pair['first']]))
                 for pair in emitted]
        return _finish(context, scope, [selected[path] for path in sorted(selected)], edges, boundary)
    except MemoryError:
        raise StorageError('graph_query_limited', 503) from None
