"""Bounded read-only relationship queries shared by HTML, JSON and WebMCP.

No request parses the vault or selects note bodies. Eligibility is checked on
both endpoints before aggregation. Mutable generations are guarded by mutation
and relation epochs; all continuations bind the complete query and policy.
"""
from dataclasses import asdict, replace
import hashlib
import json

from django.core import signing
from django.db import OperationalError
from django.db.models import Count, Min, Q
from django.db.models.functions import Substr
from django.urls import reverse
from django.utils import timezone
from wiki.contracts import PathDenied, StorageError
from wiki.policy import validate_path
from wiki.storage import require_ready
from .graph_contracts import GraphNode, LinkOccurrence, GraphEdge, LinkPage, GraphPage, LinkIssuePage
from .graph_projection import namespace_version
from .models import IndexGeneration, IndexedNote, LinkEdge, RelationState, ResolvedRelation
from .scanner import file_stat
from .search import sqlite_budget

CANDIDATE_LIMIT = 300
MAX_PAYLOAD = 512 * 1024
LIMITS = {'nodes': 200, 'edges': 500, 'items': 100, 'examined_candidates': CANDIDATE_LIMIT,
          'payload_bytes': MAX_PAYLOAD, 'depth': 2}


def _string(value, maximum, code, *, empty=True):
    if (not isinstance(value, str) or len(value) > maximum or not empty and not value
            or any(ord(c) < 32 or ord(c) == 127 for c in value)):
        raise StorageError(code)
    try:
        value.encode('utf-8', errors='strict')
    except UnicodeError:
        raise StorageError(code) from None
    return value


def _limit(value, maximum):
    if type(value) is not int or not 1 <= value <= maximum:
        raise StorageError('invalid_limit')


def _path(path):
    validate_path(path, 'content')
    if not path.lower().endswith('.md'):
        raise PathDenied()
    return path


def _node_rows(queryset):
    return queryset.annotate(short_title=Substr('title', 1, 512)).values('path', 'short_title', 'revision', 'stat')


class Query:
    def __init__(self, arguments, cursor):
        from .worker import index_status
        self.index = index_status()
        self.generation = IndexGeneration.objects.filter(pk=self.index.generation).first()
        self.relations = RelationState.objects.filter(generation=self.generation).first() if self.generation else None
        self.namespace = namespace_version() if self.index.state != 'unavailable' else ''
        self.valid = bool(self.generation and self.relations and self.relations.complete
                          and self.relations.mutation == self.generation.mutation
                          and self.relations.namespace == self.namespace and self.index.state == 'ready')
        self.complete = self.valid and self.relations.evidence_complete
        self.reasons = set()
        if not self.complete:
            self.reasons.add('projection_incomplete')
        self.cache = {}
        self.rows = {}
        self.examined = 0
        self.boundary = False
        self.query_hash = hashlib.sha256(json.dumps(arguments, sort_keys=True).encode()).hexdigest()
        self.stamp = self._stamp()
        self.after = 0 if arguments['kind'] != 'graph' else ''
        if cursor is not None:
            try:
                _string(cursor, 4096, 'graph_cursor_expired', empty=False)
                data = signing.loads(cursor, salt='graph-v1', max_age=3600)
                if data['q'] != self.query_hash or data['s'] != self.stamp or type(data['a']) is not type(self.after):
                    raise ValueError
                self.after = data['a']
            except (StorageError, signing.BadSignature, ValueError, TypeError, KeyError):
                raise StorageError('graph_cursor_expired', 409) from None

    def _stamp(self):
        return [self.generation.pk if self.generation else None,
                self.generation.mutation if self.generation else 0,
                self.relations.epoch if self.relations else 0, self.namespace, self.index.state]

    def eligible(self, path):
        if path in self.cache:
            return self.cache[path]
        if self.examined >= CANDIDATE_LIMIT:
            self.reasons.add('candidate_limit')
            self.complete = False
            return None
        self.examined += 1
        row = self.rows.get(path) if path in self.rows else _node_rows(IndexedNote.objects.filter(generation=self.generation, path=path)).first()
        return self.check_row(row) if row else self.cache.setdefault(path, None)

    def prime(self, paths):
        paths = sorted(set(paths) - self.cache.keys() - self.rows.keys())[:CANDIDATE_LIMIT - self.examined]
        self.rows.update(dict.fromkeys(paths))
        for row in _node_rows(IndexedNote.objects.filter(generation=self.generation, path__in=paths)):
            self.rows[row['path']] = row

    def check_row(self, row):
        path = row['path']
        if path in self.cache:
            return self.cache[path]
        node = None
        try:
            _path(path)
            current = file_stat(path)
            if current == row['stat']:
                node = GraphNode(path, row['short_title'], row['revision'], reverse('wiki:note', args=[path]))
            else:
                self.complete = False
                self.reasons.add('changed_indexed_file')
        except (StorageError, OSError):
            self.complete = False
            self.reasons.add('eligibility_changed')
        self.cache[path] = node
        return node

    def cursor(self, after):
        return signing.dumps({'q': self.query_hash, 's': self.stamp, 'a': after}, salt='graph-v1', compress=True)

    def relation_rows(self):
        if not self.valid:
            return ResolvedRelation.objects.none()
        return ResolvedRelation.objects.filter(generation=self.generation, epoch=self.relations.epoch)

    def occurrence(self, relation):
        edge = relation.occurrence
        if not self.eligible(edge.note.path):
            return None
        if relation.resource_type in {'note', 'self'} and not self.eligible(relation.destination):
            return None
        choices = []
        for path in relation.choices:
            if self.eligible(path):
                choices.append(path)
        state = relation.state
        if state == 'ambiguous' and len(choices) != len(relation.choices):
            state = 'unconfirmed'
        if not self.complete and state in {'missing', 'ambiguous'}:
            state = 'unconfirmed'
        return LinkOccurrence(edge.pk, edge.note.path, edge.note.revision, edge.target[:4096], edge.kind,
                              edge.fragment[:4096], tuple(edge.position), edge.position_precision,
                              edge.occurrence_kind, state, relation.destination or None,
                              relation.resource_type, tuple(choices))

    def finish(self, cls, *, next_cursor=None, **data):
        # A second observation rejects concurrent mutation/policy swaps. No old
        # graph contents are returned when storage identity becomes uncertain.
        from .worker import index_status
        current = index_status()
        if current.state == 'unavailable':
            self.complete = False
            self.reasons.add('storage_unavailable')
            data = {key: () for key in data if key in {'nodes', 'edges', 'items'}}
            next_cursor = None
        else:
            require_ready()
            generation = IndexGeneration.objects.filter(state='active').first()
            if (generation.pk if generation else None) != self.stamp[0] or (generation.mutation if generation else 0) != self.stamp[1] or namespace_version() != self.namespace or current.state != self.index.state:
                raise StorageError('graph_cursor_expired', 409)
        metadata = dict(state='unavailable' if current.state == 'unavailable' else 'ok' if self.complete else 'incomplete',
                        freshness={'state': current.state, 'last_completed': current.last_completed,
                                   'next_scheduled': current.next_scheduled,
                                   'scope': 'indexed_saved_content_not_disk_snapshot'},
                        generation=self.stamp[0], mutation=self.stamp[1], relation_epoch=self.stamp[2],
                        projection_complete=self.complete, observed_at=timezone.now().isoformat(),
                        limits={**LIMITS, 'examined': self.examined}, limiting_reasons=tuple(sorted(self.reasons)),
                        next_cursor=next_cursor)
        result = cls(**metadata, **data)
        if len(json.dumps(asdict(result), ensure_ascii=True).encode()) > MAX_PAYLOAD:
            # The caller cannot advance past omitted evidence. Ask it to restart
            # with a smaller page, rather than silently skipping oversized rows.
            self.reasons.add('payload_limit')
            result = replace(result, **{key: () for key in data if key in {'nodes', 'edges', 'items'}},
                             projection_complete=False, state='incomplete', next_cursor=None,
                             limiting_reasons=tuple(sorted(self.reasons)))
        return result


def _bounded(function):
    def wrapped(*args, **kwargs):
        try:
            with sqlite_budget():
                return function(*args, **kwargs)
        except OperationalError:
            raise StorageError('graph_query_limited', 503) from None
    return wrapped


@_bounded
def query_links(path, direction, cursor=None, limit=50):
    _path(path)
    if direction not in {'incoming', 'outgoing', 'both'}:
        raise StorageError('invalid_direction')
    _limit(limit, 100)
    query = Query({'kind': 'links', 'path': path, 'direction': direction, 'limit': limit}, cursor)
    rows = query.relation_rows()
    conditions = Q(occurrence__note__path=path)
    if direction == 'incoming':
        conditions = Q(destination=path, state='resolved', resource_type__in=['note', 'self'])
    elif direction == 'both':
        conditions |= Q(destination=path, state='resolved', resource_type__in=['note', 'self'])
    rows = list(rows.filter(conditions, occurrence_id__gt=query.after).select_related('occurrence__note')
                .defer('occurrence__note__body', 'occurrence__note__projection', 'occurrence__note__ids',
                       'occurrence__note__aliases', 'occurrence__note__tags')
                .order_by('occurrence_id')[:CANDIDATE_LIMIT])
    items = []
    after = query.after
    for row in rows:
        after = row.occurrence_id
        item = query.occurrence(row)
        if item:
            items.append(item)
        if len(items) >= limit:
            break
    more = bool(rows and (after != rows[-1].occurrence_id or len(rows) == CANDIDATE_LIMIT))
    if more:
        query.reasons.add('page_limit')
    return query.finish(LinkPage, items=tuple(items), next_cursor=query.cursor(after) if more else None)


def _matches(path, folder, tag, text):
    rows = IndexedNote.objects.filter(path=path)
    if folder:
        rows = rows.filter(path__startswith=folder + '/')
    if tag:
        rows = rows.extra(where=['EXISTS (SELECT 1 FROM json_each(indexing_indexednote.tags) WHERE value = %s)'], params=[tag])
    if text:
        rows = rows.filter(Q(path__icontains=text) | Q(title__icontains=text) | Q(indexedname__name=text.casefold()))
    return rows


def _pairs(rows):
    return rows.filter(state='resolved', resource_type='note', occurrence__occurrence_kind='link').values(
        'occurrence__note__path', 'destination').annotate(count=Count('pk'), first=Min('occurrence_id')).order_by('occurrence__note__path', 'destination')


@_bounded
def query_graph(path=None, depth=1, folder='', tag='', query='', cursor=None, node_limit=200, edge_limit=500):
    if path is not None:
        _path(path)
    if type(depth) is not int or depth not in {1, 2}:
        raise StorageError('invalid_depth')
    validate_path(folder, 'folder')
    _string(tag, 256, 'invalid_tag')
    _string(query, 256, 'invalid_search_query')
    _limit(node_limit, 200)
    _limit(edge_limit, 500)
    context = Query({'kind': 'graph', 'path': path, 'depth': depth, 'folder': folder, 'tag': tag,
                     'query': query, 'node_limit': node_limit, 'edge_limit': edge_limit}, cursor)
    if context.index.state == 'unavailable':
        return context.finish(GraphPage)
    nodes = {}
    if path:
        if context.eligible(path):
            nodes[path] = context.cache[path]
        frontier = set(nodes)
        for _ in range(depth):
            if not frontier:
                break
            pairs = list(_pairs(context.relation_rows().filter(Q(occurrence__note__path__in=frontier) | Q(destination__in=frontier)))[:501])
            context.prime([p for pair in pairs for p in [pair['occurrence__note__path'], pair['destination']]])
            following = set()
            for pair in pairs:
                source, target = pair['occurrence__note__path'], pair['destination']
                a, b = context.eligible(source), context.eligible(target)
                if not a or not b:
                    continue
                for node in [a, b]:
                    if _matches(node.path, folder, tag, query).filter(generation=context.generation).exists():
                        following.add(node.path)
                        nodes[node.path] = node
                    else:
                        context.boundary = True
            frontier = following
            if len(pairs) == 501:
                context.reasons.add('edge_candidate_limit')
        # Filtering applies to the center too; a hidden center is not evidence
        # that all connections disappeared.
        nodes = {p: n for p, n in nodes.items() if _matches(p, folder, tag, query).filter(generation=context.generation).exists()}
    else:
        rows = IndexedNote.objects.filter(generation=context.generation)
        if folder:
            rows = rows.filter(path__startswith=folder + '/')
        if tag:
            rows = rows.extra(where=['EXISTS (SELECT 1 FROM json_each(indexing_indexednote.tags) WHERE value = %s)'], params=[tag])
        if query:
            rows = rows.filter(Q(path__icontains=query) | Q(title__icontains=query) | Q(indexedname__name=query.casefold())).distinct()
        candidates = list(_node_rows(rows.filter(path__gt=context.after)).order_by('path')[:CANDIDATE_LIMIT])
        for row in candidates:
            context.examined += 1
            node = context.check_row(row)
            if node:
                nodes[node.path] = node
            if len(nodes) > node_limit:
                break
    ordered = sorted(p for p in nodes if p > context.after)
    more = len(ordered) > node_limit
    selected = ordered[:node_limit]
    if more:
        context.reasons.add('node_limit')
    if not path and len(candidates) == CANDIDATE_LIMIT:
        more = True
        context.reasons.add('candidate_limit')
    edges = []
    pairs = list(_pairs(context.relation_rows().filter(occurrence__note__path__in=selected, destination__in=selected))[:edge_limit + 1])
    samples = {row['pk']: row['position'] for row in LinkEdge.objects.filter(pk__in=[p['first'] for p in pairs[:edge_limit]]).values('pk', 'position')}
    for pair in pairs[:edge_limit]:
        source = pair['occurrence__note__path']
        edges.append(GraphEdge(source, pair['destination'], pair['count'], nodes[source].revision,
                               pair['first'], tuple(samples[pair['first']])))
    if len(pairs) > edge_limit:
        context.reasons.add('edge_limit')
    if (folder or tag or query) and not context.boundary:
        boundary = list(_pairs(context.relation_rows().filter(Q(occurrence__note__path__in=selected) | Q(destination__in=selected)))[:501])
        for pair in boundary:
            for p in [pair['occurrence__note__path'], pair['destination']]:
                if p not in nodes and context.eligible(p) and not _matches(p, folder, tag, query).filter(generation=context.generation).exists():
                    context.boundary = True
    after = selected[-1] if selected else candidates[-1]['path'] if not path and candidates else context.after
    return context.finish(GraphPage, nodes=tuple(nodes[p] for p in selected), edges=tuple(edges),
                          boundary_connections=context.boundary, next_cursor=context.cursor(after) if more and after else None)


@_bounded
def query_link_issues(folder='', issue='missing', cursor=None, limit=50):
    validate_path(folder, 'folder')
    if issue not in {'missing', 'ambiguous', 'isolated'}:
        raise StorageError('invalid_link_issue')
    _limit(limit, 100)
    query = Query({'kind': 'issues', 'folder': folder, 'issue': issue, 'limit': limit}, cursor)
    if not query.complete:
        return query.finish(LinkIssuePage)
    items = []
    after = query.after
    more = False
    if issue == 'isolated':
        rows = IndexedNote.objects.filter(generation=query.generation, pk__gt=after)
        if folder:
            rows = rows.filter(path__startswith=folder + '/')
        candidates = list(rows.values('pk', 'path').order_by('pk')[:CANDIDATE_LIMIT])
        for row in candidates:
            after = row['pk']
            node = query.eligible(row['path'])
            # Unconfirmed references and non-note outgoing references still
            # prevent an isolation claim; a self-heading does not.
            connected = query.relation_rows().filter(Q(destination=row['path'], resource_type='note') |
                (Q(occurrence__note__path=row['path']) & ~Q(resource_type='self'))).exists()
            if node and not connected:
                items.append({'path': node.path, 'title': node.title, 'href': node.href,
                              'revision': node.revision, 'issue': 'no_indexed_connections_observed'})
            if len(items) == limit:
                break
        more = bool(candidates and (after != candidates[-1]['pk'] or len(candidates) == CANDIDATE_LIMIT))
    else:
        rows = query.relation_rows().filter(state=issue, occurrence_id__gt=after)
        if folder:
            rows = rows.filter(occurrence__note__path__startswith=folder + '/')
        candidates = list(rows.select_related('occurrence__note').defer('occurrence__note__body').order_by('occurrence_id')[:CANDIDATE_LIMIT])
        for row in candidates:
            after = row.occurrence_id
            item = query.occurrence(row)
            if item and item.state == issue:
                items.append(item)
            if len(items) == limit:
                break
        more = bool(candidates and (after != candidates[-1].occurrence_id or len(candidates) == CANDIDATE_LIMIT))
    if not query.complete:
        items = []
    if more:
        query.reasons.add('page_limit')
    return query.finish(LinkIssuePage, items=tuple(items), next_cursor=query.cursor(after) if more else None)
