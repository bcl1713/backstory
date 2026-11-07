"""Expiring, bounded-work local graph traversal.

Only paths, shortest-hop witnesses and occurrence metadata live in this private
scratch database. Each request reads bounded indexed windows, never the whole
membership. SQLite transactions serialize continuations; the last response can
be replayed after a lost/aborted fetch. Failures do not consume the checkpoint.
"""
from contextlib import contextmanager
from dataclasses import asdict
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import time

from django.conf import settings
from django.db import connection

from wiki.contracts import StorageError
from .diagnostics import record_failure
from .graph_contracts import GraphEdge, GraphPage

TTL = 3600
WORK_ROWS = 100
WORK_FRONTIERS = 16
WORK_SECONDS = .025
_cleanup_directory = None
_cleanup_entries = None


def valid_checkpoint(value):
    return (set(value) == {'phase', 'session', 'after'} and value['phase'] == 'traversal'
            and isinstance(value['session'], str)
            and re.fullmatch(r'\d{10}-[0-9a-f]{32}', value['session']) is not None
            and type(value['after']) is int and value['after'] >= 0)


def _expired():
    return StorageError('graph_cursor_expired', 409)


def _cleanup(directory):
    """Amortized expiry: bounded directory work, including large abandoned runs."""
    global _cleanup_directory, _cleanup_entries
    if _cleanup_directory != directory:
        if _cleanup_entries is not None:
            _cleanup_entries.close()
        _cleanup_directory, _cleanup_entries = directory, None
    if _cleanup_entries is None:
        _cleanup_entries = os.scandir(directory)
    for _ in range(8):
        entry = next(_cleanup_entries, None)
        if entry is None:
            _cleanup_entries.close()
            _cleanup_entries = None
            break
        if re.fullmatch(r'\d{10}-[0-9a-f]{32}\.sqlite3(?:-journal)?', entry.name):
            if int(entry.name[:10]) <= time.time():
                try:
                    os.unlink(entry.path)
                except FileNotFoundError:
                    pass


@contextmanager
def _session(context):
    directory = Path(settings.BACKSTORY_DATA_DIR) / 'graph-traversals'
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    _cleanup(directory)
    checkpoint = context.after
    resume = checkpoint['phase'] == 'traversal'
    if resume:
        token = checkpoint['session']
        if int(token[:10]) <= time.time():
            raise _expired()
    else:
        token = f'{int(time.time()) + TTL:010}-{secrets.token_hex(16)}'
    path = directory / (token + '.sqlite3')
    if not resume:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.close(fd)
    elif not path.is_file():
        raise _expired()
    database = None
    try:
        database = sqlite3.connect(f'{path.as_uri()}?mode=rw', uri=True, timeout=0)
        database.row_factory = sqlite3.Row
        if not resume:
            database.executescript('''
                CREATE TABLE metadata (id INTEGER PRIMARY KEY CHECK(id=1), query TEXT,
                    stamp TEXT, revision INTEGER, phase TEXT, after INTEGER,
                    incomplete INTEGER, reasons TEXT, boundary INTEGER, replay TEXT, emitted INTEGER DEFAULT 0);
                CREATE TABLE members (id INTEGER PRIMARY KEY, path TEXT UNIQUE,
                    depth INTEGER, ancestors TEXT, display INTEGER,
                    after INTEGER DEFAULT 0, done INTEGER DEFAULT 0);
                CREATE INDEX frontier ON members(done,depth,id);
                CREATE TABLE pairs (id INTEGER PRIMARY KEY, source TEXT, destination TEXT,
                    count INTEGER, first INTEGER, position TEXT, UNIQUE(source,destination));
            ''')
            database.execute('INSERT INTO metadata(id,query,stamp,revision,phase,after,incomplete,reasons,boundary,replay) VALUES(1,?,?,0,\'discover\',0,0,\'[]\',0,NULL)',
                             (context.query_hash, json.dumps(context.stamp)))
            database.commit()
        database.execute('BEGIN IMMEDIATE')
        meta = dict(database.execute('SELECT * FROM metadata WHERE id=1').fetchone())
        replay = resume and checkpoint['after'] == meta['revision'] - 1 and meta['replay'] is not None
        if (meta['query'] != context.query_hash or json.loads(meta['stamp']) != context.stamp
                or resume and meta['revision'] != checkpoint['after'] and not replay):
            raise _expired()
        meta['is_replay'] = replay
        yield database, meta, token
        database.commit()
    except sqlite3.Error as error:
        # State loss, contention and disk exhaustion must never advance a cursor.
        record_failure('graph', error)
        raise StorageError('graph_traversal_unavailable', 503) from None
    finally:
        if database is not None:
            database.close()


def _adjacent(context, path, after, limit):
    # Seek only outgoing occurrences: incoming-only hubs neither join the
    # neighborhood nor consume work as traversal frontiers.
    if not context.valid:
        return [], []
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT r.occurrence_id '
            'FROM indexing_resolvedrelation r INDEXED BY relation_source_page '
            'WHERE r.generation_id=%s AND r.epoch=%s AND r.source=%s '
            'AND r.occurrence_id>%s '
            # Read raw bounded rows before filtering, so a long dirty/asset
            # window cannot consume unbounded SQL work without a checkpoint.
            'ORDER BY r.occurrence_id LIMIT %s',
            [context.generation.pk, context.relations.epoch, path, after, limit])
        ids = [row[0] for row in cursor.fetchall()]
    if not ids:
        return [], []
    rows = list(context.relation_rows().filter(
        occurrence_id__in=ids, resource_type='note',
        occurrence__occurrence_kind='link').values(
            'occurrence_id', 'source', 'destination', 'occurrence__position').order_by('occurrence_id'))
    return ids, rows


def _member(database, path):
    return database.execute('SELECT * FROM members WHERE path=?', (path,)).fetchone()


def _witness(context, member):
    paths = [*json.loads(member['ancestors']), member['path']]
    if not context.can_check(paths):
        return None
    context.prime(paths)
    if not all(context.eligible(path) for path in paths):
        # An earlier page's bridge changed outside the index mutation stream.
        # Restart rather than publishing descendants of a revoked witness.
        raise _expired()
    return context.cache[member['path']]


def _discover(context, database, meta, depth, folder, tag, text):
    from .graph import _filtered_nodes
    deadline = time.monotonic() + WORK_SECONDS
    consumed = 0
    progressed = False
    for _ in range(WORK_FRONTIERS):
        front = database.execute('SELECT * FROM members WHERE done=0 ORDER BY depth,id LIMIT 1').fetchone()
        if front is None:
            meta['phase'], meta['after'] = 'edges', 0
            return
        if consumed >= WORK_ROWS or progressed and time.monotonic() >= deadline:
            return
        if _witness(context, front) is None:
            return
        window = WORK_ROWS - consumed
        ids, rows = _adjacent(context, front['path'], front['after'], window)
        if front['depth'] == depth:
            # Membership is settled before final-layer scans. Unrelated targets
            # cannot join; do not spend filesystem eligibility on them.
            rows = [row for row in rows if _member(database, row['destination']) is not None]
        paths = {p for row in rows for p in (row['source'], row['destination'])}
        context.prime(paths)
        display = set(_filtered_nodes(context.generation, folder, tag, text).filter(path__in=paths)
                      .values_list('path', flat=True)) if paths else set()
        after = front['after']
        for row in rows:
            # Slow setup may use the soft slice. Always advance one bounded
            # row before yielding; the hard SQL deadline still fails closed.
            if (progressed and time.monotonic() >= deadline
                    or not context.can_check([row['source'], row['destination']])):
                database.execute('UPDATE members SET after=? WHERE id=?', (after, front['id']))
                return
            source, target = row['source'], row['destination']
            a, b = context.eligible(source), context.eligible(target)
            after = row['occurrence_id']
            progressed = True
            if not a or not b:
                continue
            if front['depth'] < depth:
                ancestors = [*json.loads(front['ancestors']), front['path']]
                database.execute('INSERT OR IGNORE INTO members(path,depth,ancestors,display) VALUES(?,?,?,?)',
                                 (target, front['depth'] + 1, json.dumps(ancestors), int(target in display)))
            if (folder or tag or text) and ((source in display) != (target in display)):
                meta['boundary'] = 1
            # Scan every member, including the last layer, to retain all
            # induced edges. BFS settles membership before last-layer scans.
            if _member(database, target) is not None:
                database.execute('INSERT INTO pairs(source,destination,count,first,position) VALUES(?,?,1,?,?) '
                                 'ON CONFLICT(source,destination) DO UPDATE SET count=count+1',
                                 (source, target, row['occurrence_id'], json.dumps(row['occurrence__position'])))
        consumed += len(ids)
        progressed = True
        if len(ids) == window:
            database.execute('UPDATE members SET after=? WHERE id=?', (ids[-1], front['id']))
            return
        database.execute('UPDATE members SET done=1 WHERE id=?', (front['id'],))


def _emit(context, database, meta, node_limit, edge_limit):
    nodes, edges = {}, []
    deadline = time.monotonic() + WORK_SECONDS
    progressed = False
    if meta['phase'] == 'edges' and node_limit >= 2:
        candidates = database.execute('SELECT p.* FROM pairs p WHERE id>? ORDER BY id LIMIT ?',
                                      (meta['after'], WORK_ROWS)).fetchall()
        for row in candidates:
            if progressed and time.monotonic() >= deadline:
                return nodes, edges
            members = [_member(database, row[column]) for column in ('source', 'destination')]
            if not all(member['display'] for member in members):
                meta['after'] = row['id']
                progressed = True
                continue
            extra = {member['path'] for member in members} - nodes.keys()
            if len(nodes) + len(extra) > node_limit or len(edges) >= edge_limit:
                context.reasons.add('page_limit')
                return nodes, edges
            for member in members:
                node = _witness(context, member)
                if node is None:
                    return nodes, edges
                nodes[node.path] = node
            edges.append(GraphEdge(row['source'], row['destination'], row['count'],
                                   nodes[row['source']].revision, row['first'], tuple(json.loads(row['position']))))
            meta['after'] = row['id']
            progressed = True
        if len(candidates) == WORK_ROWS:
            return nodes, edges
        meta['phase'], meta['after'] = 'nodes', 0
    elif meta['phase'] == 'edges':
        context.reasons.add('node_limit')
        meta['boundary'] = 1
        meta['phase'], meta['after'] = 'nodes', 0
    if meta['phase'] == 'nodes':
        candidates = database.execute('SELECT * FROM members WHERE id>? ORDER BY id LIMIT ?',
                                      (meta['after'], WORK_ROWS)).fetchall()
        for member in candidates:
            if progressed and time.monotonic() >= deadline:
                return nodes, edges
            if member['display'] and member['path'] not in nodes:
                if len(nodes) >= node_limit:
                    context.reasons.add('node_limit')
                    return nodes, edges
                node = _witness(context, member)
                if node is None:
                    return nodes, edges
                nodes[node.path] = node
            meta['after'] = member['id']
            progressed = True
        if len(candidates) < WORK_ROWS:
            meta['phase'] = 'done'
    return nodes, edges


# This is an optimization threshold, never a membership limit. Larger/raw-heavy
# neighborhoods fall through to the resumable query with the same eligibility
# cache. Pair seeks avoid scanning a last-layer hub's unrelated destinations.
SMALL_MEMBERS = 32


def small_page(context, path, depth, folder, tag, text, node_limit, edge_limit):
    from .graph import _filtered_nodes, _selected_pairs
    from .models import LinkEdge
    deadline = time.monotonic() + WORK_SECONDS
    root = context.eligible(path)
    if root is None:
        return context.finish(GraphPage)
    members, queue, consumed = {path: root}, [(path, 0)], 0
    for source, distance in queue:
        if distance == depth:
            continue
        if time.monotonic() >= deadline or consumed >= WORK_ROWS:
            return None
        ids, rows = _adjacent(context, source, 0, WORK_ROWS - consumed + 1)
        consumed += len(ids)
        if consumed > WORK_ROWS:
            return None
        context.prime(row['destination'] for row in rows)
        for row in rows:
            target = row['destination']
            node = context.eligible(target)
            if node and target not in members:
                members[target] = node
                queue.append((target, distance + 1))
                if len(members) > SMALL_MEMBERS:
                    return None
    display = set(_filtered_nodes(context.generation, folder, tag, text).filter(path__in=members)
                  .values_list('path', flat=True))
    if len(display) > node_limit or time.monotonic() >= deadline:
        return None
    # A fixed-size VALUES table drives exact indexed pair lookups. Never walk
    # generation order or eligibility-check out-of-scope last-layer targets.
    pairs = _selected_pairs(context, {(a, b) for a in members for b in members if a != b})
    shown = [row for row in pairs if row['source'] in display and row['destination'] in display]
    if len(shown) > edge_limit:
        return None
    positions = dict(LinkEdge.objects.filter(pk__in=[row['first'] for row in shown])
                     .values_list('pk', 'position'))
    edges = tuple(GraphEdge(row['source'], row['destination'], row['count'],
                            members[row['source']].revision, row['first'], tuple(positions[row['first']]))
                  for row in shown)
    return context.finish(GraphPage, nodes=tuple(members[p] for p in sorted(display)), edges=edges,
                          boundary_connections=any((row['source'] in display) != (row['destination'] in display)
                                                   for row in pairs))


def local_page(context, path, depth, folder, tag, text, node_limit, edge_limit):
    try:
        return _local_page(context, path, depth, folder, tag, text, node_limit, edge_limit)
    except OSError as error:
        record_failure('graph', error)
        raise StorageError('graph_traversal_unavailable', 503) from None


def _local_page(context, path, depth, folder, tag, text, node_limit, edge_limit):
    from .graph import _filtered_nodes
    with _session(context) as (database, meta, token):
        if meta['is_replay']:
            previous = json.loads(meta['replay'])
            nodes = []
            members = [_member(database, node['path']) for node in previous['nodes']]
            context.prime([p for member in members for p in [*json.loads(member['ancestors']), member['path']]])
            for member in members:
                node = _witness(context, member)
                if node is None:
                    raise _expired()
                nodes.append(node)
            edges = tuple(GraphEdge(**{**edge, 'position': tuple(edge['position'])}) for edge in previous['edges'])
            context.complete = context.complete and previous['projection_complete']
            context.reasons.update(previous['limiting_reasons'])
            return context.finish(GraphPage, nodes=tuple(nodes), edges=edges,
                                  boundary_connections=previous['boundary_connections'],
                                  next_cursor=previous['next_cursor'])
        if meta['revision'] == 0:
            node = context.eligible(path)
            if node:
                display = _filtered_nodes(context.generation, folder, tag, text).filter(path=path).exists()
                database.execute('INSERT INTO members(path,depth,ancestors,display) VALUES(?,0,\'[]\',?)',
                                 (path, int(display)))
        if meta['incomplete']:
            context.complete = False
            context.reasons.update(json.loads(meta['reasons']))
        if meta['phase'] == 'discover':
            _discover(context, database, meta, depth, folder, tag, text)
        nodes, edges = _emit(context, database, meta, node_limit, edge_limit)
        if meta['phase'] == 'discover':
            # A safe shortest-hop witness is useful before every frontier has
            # finished. Emit bounded validated membership, without partial edge
            # aggregates; edge counts are published only after discovery.
            for member in database.execute('SELECT * FROM members WHERE id>? ORDER BY id LIMIT ?',
                                           (meta['emitted'], min(node_limit, WORK_ROWS))).fetchall():
                node = _witness(context, member) if member['display'] else None
                if member['display'] and node is None:
                    break
                if node:
                    nodes[node.path] = node
                meta['emitted'] = member['id']
            database.execute('UPDATE metadata SET emitted=? WHERE id=1', (meta['emitted'],))
            context.reasons.add('discovery_pending')
        more = meta['phase'] != 'done'
        checkpoint = {'phase': 'traversal', 'session': token, 'after': meta['revision'] + 1}
        page = context.finish(GraphPage, nodes=tuple(nodes[p] for p in sorted(nodes)), edges=tuple(edges),
                              boundary_connections=bool(meta['boundary']),
                              next_cursor=context.cursor(checkpoint) if more else None)
        # A payload failure must not consume omitted work. The response asks
        # for smaller bounds; expiry keeps the abandoned state bounded in time.
        if 'payload_limit' in page.limiting_reasons:
            raise StorageError('graph_payload_limited', 503)
        persistent = context.reasons - {'page_limit', 'node_limit', 'edge_limit', 'candidate_limit', 'discovery_pending'}
        database.execute('UPDATE metadata SET revision=?,phase=?,after=?,incomplete=?,reasons=?,boundary=?,replay=? WHERE id=1',
                         (checkpoint['after'], meta['phase'], meta['after'], int(bool(persistent)),
                          json.dumps(sorted(persistent)), meta['boundary'], json.dumps(asdict(page))))
        return page
