"""Bounded read-only relationship queries shared by HTML, JSON and WebMCP.

No request parses the vault or selects note bodies. Eligibility is checked on
both endpoints before aggregation. Mutable generations are guarded by mutation
and relation epochs; all continuations bind the complete query and policy.
"""
from dataclasses import asdict, replace
import hashlib
import json

from django.core import signing
from django.db import connection, OperationalError
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
from .search import QueryBudget, sqlite_budget
from .diagnostics import record_failure

CANDIDATE_LIMIT = 300
MAX_PAYLOAD = 512 * 1024
LIMITS = {'nodes': 200, 'edges': 500, 'items': 100, 'examined_candidates': CANDIDATE_LIMIT,
          'payload_bytes': MAX_PAYLOAD, 'depth': 8}


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
    return queryset.annotate(short_title=Substr('title', 1, 512)).values('pk', 'path', 'short_title', 'revision', 'stat')


class Query:
    def __init__(self, arguments, cursor):
        from .worker import index_status
        self.index = index_status()
        self.generation = IndexGeneration.objects.filter(pk=self.index.generation).first()
        self.relations = RelationState.objects.filter(generation=self.generation).first() if self.generation else None
        self.namespace = namespace_version() if self.index.state != 'unavailable' else ''
        # Scan freshness does not revoke independently published clean sources.
        self.valid = bool(self.index.state != 'unavailable' and self.generation and self.relations
                          and self.relations.mutation == self.generation.mutation
                          and self.relations.namespace == self.namespace)
        self.complete = self.valid and self.relations.complete and self.relations.evidence_complete
        self.reasons = set()
        if not self.complete:
            self.reasons.add('projection_incomplete')
        if self.index.state != 'ready':
            self.complete = False
            self.reasons.add('index_updating')
        self.cache = {}
        self.rows = {}
        self.examined = 0
        self.boundary = False
        self.query_hash = hashlib.sha256(json.dumps(arguments, sort_keys=True).encode()).hexdigest()
        self.stamp = self._stamp()
        self.after = {'phase': 'edges', 'after': 0} if arguments['kind'] == 'graph' else 0
        if cursor is not None:
            try:
                _string(cursor, 4096, 'graph_cursor_expired', empty=False)
                data = signing.loads(cursor, salt='graph-v1', max_age=3600)
                if data['q'] != self.query_hash or data['s'] != self.stamp or type(data['a']) is not type(self.after):
                    raise ValueError
                if isinstance(self.after, dict) and (set(data['a']) != {'phase', 'after'} or data['a']['phase'] not in {'edges', 'nodes'} or type(data['a']['after']) is not int or data['a']['after'] < 0):
                    raise ValueError
                self.after = data['a']
            except (StorageError, signing.BadSignature, ValueError, TypeError, KeyError):
                raise StorageError('graph_cursor_expired', 409) from None

    def _stamp(self):
        return [self.generation.pk if self.generation else None,
                self.generation.mutation if self.generation else 0,
                self.relations.epoch if self.relations else 0, self.namespace,
                bool(self.relations and self.relations.complete), bool(self.relations and self.relations.evidence_complete),
                self.relations.publication if self.relations else 0]

    def eligible(self, path):
        if path in self.cache:
            return self.cache[path]
        if self.examined >= CANDIDATE_LIMIT:
            self.reasons.add('candidate_limit')
            self.complete = False
            return None
        row = self.rows.get(path) if path in self.rows else _node_rows(IndexedNote.objects.filter(generation=self.generation, path=path)).first()
        if row:
            return self.check_row(row)
        self.complete = False
        self.examined += 1
        self.reasons.add('unindexed_endpoint')
        return self.cache.setdefault(path, None)

    def prime(self, paths):
        paths = sorted(set(paths) - self.cache.keys() - self.rows.keys())[:CANDIDATE_LIMIT - self.examined]
        self.rows.update(dict.fromkeys(paths))
        for row in _node_rows(IndexedNote.objects.filter(generation=self.generation, path__in=paths)):
            self.rows[row['path']] = row

    def check_row(self, row):
        path = row['path']
        if path in self.cache:
            return self.cache[path]
        if self.examined >= CANDIDATE_LIMIT:
            self.reasons.add('candidate_limit')
            self.complete = False
            return None
        self.examined += 1
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

    def can_check(self, paths):
        if len(set(paths) - self.cache.keys()) + self.examined <= CANDIDATE_LIMIT:
            return True
        self.reasons.add('candidate_limit')
        self.complete = False
        return False

    def cursor(self, after):
        return signing.dumps({'q': self.query_hash, 's': self.stamp, 'a': after}, salt='graph-v1', compress=True)

    def relation_rows(self):
        if not self.valid:
            return ResolvedRelation.objects.none()
        return ResolvedRelation.objects.filter(generation=self.generation, epoch=self.relations.epoch,
                                               occurrence__note__relations_dirty=False)

    def incident_pairs(self, paths):
        # Separate indexed lookups avoid an OR spanning the raw-source join,
        # which otherwise makes SQLite scan the whole relation generation.
        pairs = {}
        for column in ('source', 'destination'):
            rows = list(_pairs(self.relation_rows().filter(**{column + '__in': paths}))[:501])
            if len(rows) == 501:
                self.reasons.add('edge_candidate_limit')
            for row in rows:
                pairs[row['source'], row['destination']] = row
        return [pairs[key] for key in sorted(pairs)]

    def occurrence_rows(self, rows):
        # Bound large target spellings in SQL and do not multiply metadata/body
        # memory by the number of occurrences from the same source note.
        return rows.select_related('occurrence__note').annotate(
            target_text=Substr('occurrence__target', 1, 4096),
            fragment_text=Substr('occurrence__fragment', 1, 4096)).only(
                'occurrence', 'generation', 'epoch', 'destination', 'state', 'resource_type', 'choices',
                'occurrence__note', 'occurrence__note__path', 'occurrence__note__revision',
                'occurrence__kind', 'occurrence__position', 'occurrence__position_precision',
                'occurrence__occurrence_kind')

    def occurrence(self, relation):
        if relation.resource_type == 'excluded':
            return None
        edge = relation.occurrence
        if not self.eligible(edge.note.path):
            return None
        if relation.resource_type in {'note', 'self'} and not self.eligible(relation.destination):
            return None
        if relation.resource_type == 'asset':
            try:
                validate_path(relation.destination, 'content')
                file_stat(relation.destination)
            except (StorageError, OSError):
                self.complete = False
                self.reasons.add('eligibility_changed')
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
        return LinkOccurrence(edge.pk, edge.note.path, edge.note.revision, relation.target_text, edge.kind,
                              relation.fragment_text, tuple(edge.position), edge.position_precision,
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
            relations = RelationState.objects.filter(generation=generation).first() if generation else None
            relation_stamp = [relations.epoch if relations else 0, bool(relations and relations.complete),
                              bool(relations and relations.evidence_complete), relations.publication if relations else 0]
            if (generation.pk if generation else None) != self.stamp[0] or (generation.mutation if generation else 0) != self.stamp[1] or namespace_version() != self.namespace:
                raise StorageError('graph_cursor_expired', 409)
            if relation_stamp != [self.stamp[2], self.stamp[4], self.stamp[5], self.stamp[6]]:
                raise StorageError('graph_cursor_expired', 409)
            if current.state != 'ready':
                self.complete = False
                self.reasons.add('index_updating')
        # Completeness can change after occurrences/diagnostics were collected.
        # Reconcile absence claims with the final observation, retaining links.
        if not self.complete:
            if cls is LinkIssuePage:
                data['items'] = ()
                next_cursor = None
            elif cls is LinkPage:
                data['items'] = tuple(replace(item, state='unconfirmed')
                                      if item.state in {'missing', 'ambiguous'} else item
                                      for item in data['items'])
        metadata = dict(state='unavailable' if current.state == 'unavailable' else 'ok' if self.complete else 'incomplete',
                        freshness={'state': current.state, 'last_completed': current.last_completed,
                                   'next_scheduled': current.next_scheduled,
                                   'scope': 'indexed_saved_content_not_disk_snapshot'},
                        generation=self.stamp[0], mutation=self.stamp[1], relation_epoch=self.stamp[2],
                        eligibility_version=self.namespace,
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
        budget = QueryBudget()
        try:
            with sqlite_budget() as budget:
                return function(*args, **kwargs)
        except OperationalError as error:
            record_failure('graph', error, budget_triggered=budget.triggered)
            raise StorageError('graph_query_limited' if budget.triggered else 'graph_database_error', 503) from None
    return wrapped


@_bounded
def query_links(path, direction, cursor=None, limit=50):
    _path(path)
    if direction not in {'incoming', 'outgoing', 'both'}:
        raise StorageError('invalid_direction')
    _limit(limit, 100)
    query = Query({'kind': 'links', 'path': path, 'direction': direction, 'limit': limit}, cursor)
    if query.index.state != 'unavailable':
        query.eligible(path)
    rows = query.relation_rows()
    conditions = Q(source=path)
    if direction == 'incoming':
        conditions = Q(destination=path, resource_type__in=['note', 'self'])
    elif direction == 'both':
        # Both columns live on the same projection and have matching indexes.
        conditions |= Q(destination=path, resource_type__in=['note', 'self'])
    rows = list(query.occurrence_rows(rows.filter(conditions, occurrence_id__gt=query.after))
                .order_by('occurrence_id')[:CANDIDATE_LIMIT])
    items = []
    after = query.after
    capped = False
    for row in rows:
        paths = [row.occurrence.note.path, *row.choices]
        if row.resource_type in {'note', 'self'}:
            paths.append(row.destination)
        if not query.can_check(paths):
            capped = True
            break
        after = row.occurrence_id
        item = query.occurrence(row)
        if item:
            items.append(item)
        if len(items) >= limit:
            break
    more = bool(rows and (capped or after != rows[-1].occurrence_id or len(rows) == CANDIDATE_LIMIT))
    if more:
        query.reasons.add('page_limit')
    return query.finish(LinkPage, items=tuple(items), next_cursor=query.cursor(after) if more else None)


def _matches(path, folder, tag, text):
    rows = IndexedNote.objects.filter(path=path)
    if folder:
        rows = rows.filter(path__startswith=folder + '/')
    if tag:
        rows = rows.extra(where=['EXISTS (SELECT 1 FROM json_each(tags) WHERE value = %s)'], params=[tag])
    if text:
        rows = rows.filter(Q(path__icontains=text) | Q(title__icontains=text) | Q(indexedname__name=text.casefold()))
    return rows


def _pairs(rows):
    # The projector assigns resource_type=note only to resolved canonical notes.
    # Avoid a redundant state equality: SQLite's low-cardinality state index
    # otherwise defeats the selective forward/inverse path indexes.
    return rows.filter(resource_type='note', occurrence__occurrence_kind='link').values(
        'source', 'destination').annotate(count=Count('pk'), first=Min('occurrence_id')).order_by('source', 'destination')


def _filtered_nodes(generation, folder, tag, text):
    rows = IndexedNote.objects.filter(generation=generation)
    if folder:
        rows = rows.filter(path__startswith=folder + '/')
    if tag:
        rows = rows.extra(where=['EXISTS (SELECT 1 FROM json_each(tags) WHERE value = %s)'], params=[tag])
    if text:
        rows = rows.filter(Q(path__icontains=text) | Q(title__icontains=text) | Q(indexedname__name=text.casefold())).distinct()
    return rows


def _selected_pairs(context, pairs):
    """Count only already-eligible pairs with indexed, bounded point lookups.

    A large OR makes SQLite evaluate every pair expression against every row.
    A bounded VALUES table plus the four-column pair index avoids that quadratic
    plan and does not change the SQL/candidate budgets. All values are bound.
    """
    if not pairs:
        return []
    ordered = sorted(pairs)
    values = ','.join('(%s,%s)' for _ in ordered)
    parameters = [p for pair in ordered for p in pair]
    parameters += [context.generation.pk, context.relations.epoch]
    sql = ('WITH wanted(source,destination) AS (VALUES ' + values + ') '
           'SELECT r.source,r.destination,COUNT(*),MIN(r.occurrence_id) '
           'FROM wanted w CROSS JOIN indexing_resolvedrelation r INDEXED BY relation_forward '
           'CROSS JOIN indexing_linkedge e CROSS JOIN indexing_indexednote n '
           'WHERE r.generation_id=%s AND r.epoch=%s '
           'AND r.source=w.source AND r.destination=w.destination AND e.id=r.occurrence_id '
           'AND n.id=e.note_id AND n.relations_dirty=0 '
           "AND r.state='resolved' AND r.resource_type='note' AND e.occurrence_kind='link' "
           'GROUP BY r.source,r.destination ORDER BY r.source,r.destination')
    with connection.cursor() as cursor:
        cursor.execute(sql, parameters)
        return [dict(source=source, destination=target, count=count, first=first)
                for source, target, count, first in cursor.fetchall()]


@_bounded
def query_graph(path=None, depth=1, folder='', tag='', query='', cursor=None, node_limit=200, edge_limit=500):
    if path is not None:
        _path(path)
    if type(depth) is not int or not 1 <= depth <= LIMITS['depth']:
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
    neighborhood = None
    center = None
    indexed_neighborhood = None
    if path:
        center = context.eligible(path)
        center_eligible = center is not None
        if depth == 1:
            # Keep the complete one-hop membership in indexed SQL. Preloading
            # and checking its first 300 endpoints on every request prevents a
            # high-degree neighborhood from ever advancing to later neighbors.
            direct = context.relation_rows().filter(resource_type='note', occurrence__occurrence_kind='link')
            indexed_neighborhood = (Q(path=path) |
                                    Q(path__in=direct.filter(source=path).values('destination')) |
                                    Q(path__in=direct.filter(destination=path).values('source')))
        else:
            neighborhood = {path} if center else set()
            frontier = set(neighborhood)
            for _ in range(depth):
                if not frontier:
                    break
                pairs = context.incident_pairs(frontier)
                context.prime([p for pair in pairs for p in [pair['source'], pair['destination']]])
                following = set()
                for pair in pairs:
                    source, target = pair['source'], pair['destination']
                    a, b = context.eligible(source), context.eligible(target)
                    if not a or not b:
                        continue
                    for node in [a, b]:
                        if node.path not in neighborhood:
                            following.add(node.path)
                            neighborhood.add(node.path)
                frontier = following
                if 'edge_candidate_limit' in context.reasons:
                    # Omitted pairs may lead to further members at this depth.
                    # Occurrence pagination cannot recover omitted membership.
                    context.complete = False
                    context.reasons.add('neighborhood_limit')
                if 'candidate_limit' in context.reasons:
                    # Traversal membership itself is incomplete; unlike a page
                    # limit, later occurrence pages cannot recover these nodes.
                    context.reasons.add('neighborhood_limit')
                    break
            # Apply display filters in one indexed query after traversal. An
            # existence query per visited endpoint consumes the shared SQL
            # deadline before even a tiny response can be assembled.
            neighborhood = set(_filtered_nodes(context.generation, folder, tag, query)
                               .filter(path__in=neighborhood).values_list('path', flat=True))
        if not _matches(path, folder, tag, query).filter(generation=context.generation).exists():
            center = None
    eligible_rows = _filtered_nodes(context.generation, folder, tag, query)
    if neighborhood is not None:
        eligible_rows = eligible_rows.filter(path__in=neighborhood)
    elif indexed_neighborhood is not None:
        eligible_rows = eligible_rows.filter(indexed_neighborhood) if center_eligible else eligible_rows.none()
    relations = context.relation_rows().filter(resource_type='note', occurrence__occurrence_kind='link')
    # Page occurrences rather than disjoint node windows. Every emitted visual
    # edge carries both endpoints in this response, even across page boundaries.
    # Numeric checkpoints keep cursors bounded for 4096-character Unicode paths.
    if path or folder or tag or query:
        relations = relations.filter(source__in=eligible_rows.values('path'), destination__in=eligible_rows.values('path'))
    nodes = {path: center} if center else {}
    phase, after = context.after['phase'], context.after['after']
    next_checkpoint = None
    selected_pairs = set()
    if phase == 'edges' and node_limit >= 2:
        candidate_relations = relations.filter(occurrence_id__gt=after)
        raw_ids = None
        if path:
            # A local view must not walk the generation-wide occurrence order
            # looking for a late source. Fetch bounded raw occurrence IDs from
            # the source-note index, then use their unique projection lookup.
            note_ids = eligible_rows.values('pk') if indexed_neighborhood is not None else list(eligible_rows.values_list('pk', flat=True)[:CANDIDATE_LIMIT])
            raw_ids = list(LinkEdge.objects.filter(note_id__in=note_ids, pk__gt=after).order_by('pk')
                           .values_list('pk', flat=True)[:CANDIDATE_LIMIT])
            candidate_relations = context.relation_rows().filter(occurrence_id__in=raw_ids)
        candidates = list(candidate_relations.order_by('occurrence_id').values(
            'occurrence_id', 'source', 'destination', 'state', 'resource_type',
            'occurrence__occurrence_kind')[:CANDIDATE_LIMIT])
        candidate_paths = {p for row in candidates for p in [row['source'], row['destination']]}
        allowed_paths = set(eligible_rows.filter(path__in=candidate_paths).values_list('path', flat=True)) if indexed_neighborhood is not None else None
        context.prime(candidate_paths)
        for row in candidates:
            source, target = row['source'], row['destination']
            if (row['state'] != 'resolved' or row['resource_type'] != 'note' or row['occurrence__occurrence_kind'] != 'link'
                    or path and (source not in (allowed_paths if allowed_paths is not None else neighborhood)
                                 or target not in (allowed_paths if allowed_paths is not None else neighborhood))):
                after = row['occurrence_id']
                continue
            if not context.can_check([source, target]):
                next_checkpoint = {'phase': 'edges', 'after': after}
                break
            a, b = context.eligible(source), context.eligible(target)
            if a and b:
                additional = len({source, target} - nodes.keys())
                if len(nodes) + additional > node_limit or len(selected_pairs) >= edge_limit and (source, target) not in selected_pairs:
                    context.reasons.add('node_limit' if len(nodes) + additional > node_limit else 'edge_limit')
                    next_checkpoint = {'phase': 'edges', 'after': after}
                    break
                nodes[source], nodes[target] = a, b
                selected_pairs.add((source, target))
            after = row['occurrence_id']
        # Hidden dirty sources may fill an entire raw window. Exhausting that
        # window still advances, even when no published relation was returned.
        if next_checkpoint is None and raw_ids:
            after = max(after, raw_ids[-1])
        if next_checkpoint is None and (len(candidates) == CANDIDATE_LIMIT or raw_ids is not None and len(raw_ids) == CANDIDATE_LIMIT):
            next_checkpoint = {'phase': 'edges', 'after': after}
            context.reasons.add('candidate_limit')
        elif next_checkpoint is None:
            phase, after = 'nodes', 0
    elif phase == 'edges':
        if relations.exists():
            context.reasons.add('node_limit')
            context.boundary = True
        phase, after = 'nodes', 0
    if next_checkpoint is None and phase == 'nodes':
        node_rows = eligible_rows.filter(pk__gt=after)
        if path and indexed_neighborhood is None:
            local_ids = list(eligible_rows.values_list('pk', flat=True)[:CANDIDATE_LIMIT])
            node_rows = IndexedNote.objects.filter(pk__in=local_ids, pk__gt=after)
        candidates = list(_node_rows(node_rows).order_by('pk')[:CANDIDATE_LIMIT])
        for row in candidates:
            if row['path'] in nodes:
                after = row['pk']
                continue
            if len(nodes) >= node_limit:
                context.reasons.add('node_limit')
                # A one-node local response always retains its center. It
                # explicitly cannot represent edges; use a larger limit/links.
                if not (center and node_limit == 1):
                    next_checkpoint = {'phase': 'nodes', 'after': after}
                break
            if not context.can_check([row['path']]):
                next_checkpoint = {'phase': 'nodes', 'after': after}
                break
            node = context.check_row(row)
            if node:
                nodes[node.path] = node
            after = row['pk']
        if next_checkpoint is None and len(candidates) == CANDIDATE_LIMIT and not (center and node_limit == 1):
            next_checkpoint = {'phase': 'nodes', 'after': after}
            context.reasons.add('candidate_limit')
    pairs = _selected_pairs(context, selected_pairs)
    edges = []
    samples = {row['pk']: row['position'] for row in LinkEdge.objects.filter(pk__in=[p['first'] for p in pairs[:edge_limit]]).values('pk', 'position')}
    for pair in pairs[:edge_limit]:
        source = pair['source']
        edges.append(GraphEdge(source, pair['destination'], pair['count'], nodes[source].revision,
                               pair['first'], tuple(samples[pair['first']])))
    if len(pairs) > edge_limit:
        context.reasons.add('edge_limit')
    if (folder or tag or query) and not context.boundary:
        boundary = context.incident_pairs(nodes)
        for pair in boundary:
            for p in [pair['source'], pair['destination']]:
                if p not in nodes and context.eligible(p) and not _matches(p, folder, tag, query).filter(generation=context.generation).exists():
                    context.boundary = True
    return context.finish(GraphPage, nodes=tuple(nodes[p] for p in sorted(nodes)), edges=tuple(edges),
                          boundary_connections=context.boundary, next_cursor=context.cursor(next_checkpoint) if next_checkpoint else None)


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
        # Eligibility involves filesystem checks, so examine a small continuing
        # note window rather than spending the whole SQL deadline on 300 notes.
        note_window = 20
        candidates = list(rows.values('pk', 'path').order_by('pk')[:note_window])
        incident_examined = 0
        for row in candidates:
            if not query.can_check([row['path']]) or incident_examined >= CANDIDATE_LIMIT:
                more = True
                query.reasons.add('candidate_limit')
                break
            after = row['pk']
            node = query.eligible(row['path'])
            # Unconfirmed references and non-note outgoing references still
            # prevent an isolation claim; a self-heading does not.
            remaining = CANDIDATE_LIMIT - incident_examined
            incident_ids = set(query.relation_rows().filter(destination=row['path'], resource_type='note')
                               .values_list('pk', flat=True)[:remaining])
            incident_ids.update(query.relation_rows().filter(source=row['path']).exclude(resource_type='self')
                                .values_list('pk', flat=True)[:remaining])
            # These IDs were already selected inside this epoch. Reapplying a
            # generation predicate lets SQLite choose a broad generation index
            # over the primary-key lookup. The final epoch check rejects races.
            incident = list(query.occurrence_rows(ResolvedRelation.objects.filter(pk__in=sorted(incident_ids)[:remaining])))
            incident_examined += len(incident)
            connected = False
            for relation in incident:
                if query.occurrence(relation):
                    connected = True
                    break
            if len(incident) == CANDIDATE_LIMIT:
                query.complete = False
                query.reasons.add('candidate_limit')
            if node and not connected:
                items.append({'path': node.path, 'title': node.title, 'href': node.href,
                              'revision': node.revision, 'issue': 'no_indexed_connections_observed'})
            if len(items) == limit:
                break
        more = more or bool(candidates and (after != candidates[-1]['pk'] or len(candidates) == note_window))
    else:
        rows = query.relation_rows().filter(state=issue, occurrence_id__gt=after)
        if folder:
            rows = rows.filter(source__startswith=folder + '/')
        candidates = list(query.occurrence_rows(rows).order_by('occurrence_id')[:CANDIDATE_LIMIT])
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
