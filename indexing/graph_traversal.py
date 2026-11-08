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
from django.core import signing
from django.db import connection

from wiki.contracts import StorageError
from .diagnostics import record_failure
from .graph_contracts import GraphEdge, GraphPage

TTL = 3600
WORK_ROWS = 400
WORK_FRONTIERS = 128
WORK_SECONDS = .075
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
    checkpoint = context.after if context.has_cursor else context.exploration_checkpoint or context.after
    resume = checkpoint['phase'] == 'traversal'
    if context.has_cursor and context.exploration_checkpoint and context.exploration_checkpoint != checkpoint:
        raise _expired()
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
                    incomplete INTEGER, reasons TEXT, boundary INTEGER, replay TEXT, emitted INTEGER DEFAULT 0, action TEXT DEFAULT '', pending TEXT DEFAULT '');
                CREATE TABLE members (id INTEGER PRIMARY KEY, path TEXT UNIQUE,
                    depth INTEGER, ancestors TEXT, display INTEGER,
                    after INTEGER DEFAULT 0, done INTEGER DEFAULT 0, mode INTEGER DEFAULT 0);
                CREATE INDEX frontier ON members(done,depth,id);
                CREATE TABLE pairs (id INTEGER PRIMARY KEY, source TEXT, destination TEXT,
                    emitted INTEGER DEFAULT 0, UNIQUE(source,destination));
                CREATE INDEX pending ON pairs(emitted,id);
                CREATE TABLE adjacency (source TEXT, destination TEXT, occurrence_id INTEGER,
                    PRIMARY KEY(source,occurrence_id));
                CREATE TABLE cached_sources (path TEXT PRIMARY KEY);
                CREATE TABLE expansions (path TEXT PRIMARY KEY);
            ''')
            database.execute('INSERT INTO metadata(id,query,stamp,revision,phase,after,incomplete,reasons,boundary,replay) VALUES(1,?,?,0,\'discover\',0,0,\'[]\',0,NULL)',
                             (context.exploration_hash, json.dumps(context.stamp)))
            database.commit()
        database.execute('BEGIN IMMEDIATE')
        meta = dict(database.execute('SELECT * FROM metadata WHERE id=1').fetchone())
        refresh = resume and not context.has_cursor and context.expansion is None
        replay = (resume and not refresh and checkpoint['after'] == meta['revision'] - 1
                  and meta['replay'] is not None and meta['action'] == (context.expansion or ''))
        recover_refresh = refresh and checkpoint['after'] == meta['revision'] - 1
        if (meta['query'] != context.exploration_hash or json.loads(meta['stamp']) != context.stamp
                or resume and meta['revision'] != checkpoint['after'] and not replay and not recover_refresh):
            raise _expired()
        if context.has_cursor and meta['action'] != (context.expansion or ''):
            raise _expired()
        meta['is_replay'] = replay
        meta['new_action'] = resume and not context.has_cursor and not replay
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


def _cached_adjacent(context, database, front, limit):
    """Reuse complete source windows, including former boundary destinations."""
    if database.execute('SELECT 1 FROM cached_sources WHERE path=?', (front['path'],)).fetchone():
        rows = [dict(row) for row in database.execute(
            'SELECT source,destination,occurrence_id FROM adjacency WHERE source=? AND occurrence_id>? '
            'ORDER BY occurrence_id LIMIT ?', (front['path'], front['after'], limit))]
        return [row['occurrence_id'] for row in rows], rows
    ids, rows = _adjacent(context, front['path'], front['after'], limit)
    database.executemany('INSERT OR IGNORE INTO adjacency VALUES(?,?,?)',
                         [(row['source'], row['destination'], row['occurrence_id']) for row in rows])
    if len(ids) < limit:
        database.execute('INSERT OR IGNORE INTO cached_sources VALUES(?)', (front['path'],))
    return ids, rows


def _terminal_batch(context, database, meta, depth):
    """Intersect a bounded group of terminal sources in one indexed query.

    A small membership uses exact pair probes, avoiding each leaf's count,
    query setup, and unrelated raw-heavy outgoing occurrences.
    """
    from .graph import _selected_pairs
    count = database.execute('SELECT COUNT(*) FROM members').fetchone()[0]
    if count > 128:
        return False
    fronts = database.execute('SELECT * FROM members WHERE done=0 ORDER BY depth,id LIMIT ?',
                             (max(1, 2048 // max(count, 1)),)).fetchall()
    if not fronts or any(front['depth'] != depth for front in fronts):
        return False
    members = database.execute('SELECT * FROM members ORDER BY id').fetchall()
    paths = {p for m in [*fronts, *members] for p in [*json.loads(m['ancestors']), m['path']]}
    if not context.can_check(paths):
        return False
    context.prime(paths)
    for member in members:
        if _witness(context, member) is None:
            return False
    wanted = {(front['path'], member['path']) for front in fronts for member in members
              if member['id'] > front['after']}
    pairs = _selected_pairs(context, wanted) if context.valid else []
    for row in pairs:
        source, target = _member(database, row['source']), _member(database, row['destination'])
        if source['display'] != target['display']:
            meta['boundary'] = 1
        database.execute('INSERT OR IGNORE INTO pairs(source,destination) VALUES(?,?)',
                         (row['source'], row['destination']))
    database.executemany('UPDATE members SET done=1 WHERE id=?', [(front['id'],) for front in fronts])
    return True


def _member(database, path):
    return database.execute('SELECT * FROM members WHERE path=?', (path,)).fetchone()


def _terminal_mode(context, database, front):
    """Choose the smaller indexed domain: source occurrences or member pairs."""
    if front['mode']:
        return front['mode']
    count = database.execute('SELECT COUNT(*) FROM members').fetchone()[0]
    fanout = 0
    if context.valid:
        with connection.cursor() as cursor:
            cursor.execute('SELECT COUNT(*) FROM (SELECT 1 FROM indexing_resolvedrelation '
                           'INDEXED BY relation_source_page WHERE generation_id=%s AND epoch=%s '
                           'AND source=%s LIMIT %s)',
                           [context.generation.pk, context.relations.epoch, front['path'], count + 1])
            fanout = cursor.fetchone()[0]
    mode = 2 if fanout > count else 1
    database.execute('UPDATE members SET mode=? WHERE id=?', (mode, front['id']))
    return mode


def _member_pairs(context, database, front, limit):
    from .graph import _selected_pairs
    targets = database.execute('SELECT id,path FROM members WHERE id>? ORDER BY id LIMIT ?',
                               (front['after'], limit)).fetchall()
    ids = [row['id'] for row in targets]
    target_ids = {row['path']: row['id'] for row in targets}
    pairs = _selected_pairs(context, {(front['path'], row['path']) for row in targets}) if context.valid else []
    # The checkpoint is a target member ID, never an occurrence ID, in this mode.
    rows = [dict(source=row['source'], destination=row['destination'],
                 occurrence_id=target_ids[row['destination']]) for row in pairs]
    return ids, sorted(rows, key=lambda row: row['occurrence_id'])


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
        if _terminal_batch(context, database, meta, depth):
            progressed = True
            if time.monotonic() >= deadline:
                return
            continue
        front = database.execute('SELECT * FROM members WHERE done=0 ORDER BY depth,id LIMIT 1').fetchone()
        if front is None:
            meta['phase'], meta['after'] = 'edges', 0
            return
        if consumed >= WORK_ROWS or progressed and time.monotonic() >= deadline:
            return
        if _witness(context, front) is None:
            return
        window = WORK_ROWS - consumed
        if front['depth'] == depth and _terminal_mode(context, database, front) == 2:
            ids, rows = _member_pairs(context, database, front, window)
        else:
            ids, rows = _cached_adjacent(context, database, front, window)
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
                database.execute('UPDATE members SET depth=?,ancestors=?,done=0,after=0,mode=0 WHERE path=? AND depth>?',
                                 (front['depth'] + 1, json.dumps(ancestors), target, front['depth'] + 1))
            if (folder or tag or text) and ((source in display) != (target in display)):
                meta['boundary'] = 1
            # BFS settles membership before the terminal-layer intersection.
            # Each discovered pair is published once with its full aggregate.
            if _member(database, target) is not None:
                database.execute('INSERT OR IGNORE INTO pairs(source,destination) VALUES(?,?)', (source, target))
        consumed += len(ids)
        progressed = True
        if len(ids) == window:
            database.execute('UPDATE members SET after=? WHERE id=?', (ids[-1], front['id']))
            return
        database.execute('UPDATE members SET done=1 WHERE id=?', (front['id'],))


def _emit(context, database, meta, node_limit, edge_limit):
    from .graph import _selected_pairs
    from .models import LinkEdge
    nodes, edges = {}, []
    deadline = time.monotonic() + WORK_SECONDS
    progressed = False
    selected = set()
    if meta['phase'] in {'discover', 'edges'} and node_limit >= 2:
        candidates = database.execute('SELECT * FROM pairs WHERE emitted=0 ORDER BY id LIMIT ?',
                                      (WORK_ROWS,)).fetchall()
        witnesses = [_member(database, row[column]) for row in candidates for column in ('source', 'destination')]
        context.prime(p for member in witnesses for p in [*json.loads(member['ancestors']), member['path']])
        for row in candidates:
            if progressed and time.monotonic() >= deadline:
                break
            members = [_member(database, row[column]) for column in ('source', 'destination')]
            if not all(member['display'] for member in members):
                database.execute('UPDATE pairs SET emitted=1 WHERE id=?', (row['id'],))
                progressed = True
                continue
            extra = {member['path'] for member in members} - nodes.keys()
            if len(nodes) + len(extra) > node_limit or len(selected) >= edge_limit:
                context.reasons.add('page_limit')
                break
            for member in members:
                node = _witness(context, member)
                if node is None:
                    break
                nodes[node.path] = node
            else:
                selected.add((row['source'], row['destination']))
                database.execute('UPDATE pairs SET emitted=1 WHERE id=?', (row['id'],))
                progressed = True
                continue
            break
        pairs = _selected_pairs(context, selected)
        positions = dict(LinkEdge.objects.filter(pk__in=[row['first'] for row in pairs]).values_list('pk', 'position'))
        edges = [GraphEdge(row['source'], row['destination'], row['count'], nodes[row['source']].revision,
                           row['first'], tuple(positions[row['first']])) for row in pairs]
        if meta['phase'] == 'edges' and not database.execute('SELECT 1 FROM pairs WHERE emitted=0 LIMIT 1').fetchone():
            meta['phase'], meta['after'] = 'nodes', 0
    elif meta['phase'] == 'edges':
        context.reasons.add('node_limit')
        meta['boundary'] = 1
        meta['phase'], meta['after'] = 'nodes', 0
    if meta['phase'] == 'nodes':
        candidates = database.execute('SELECT * FROM members WHERE id>? ORDER BY id LIMIT ?',
                                      (meta['after'], WORK_ROWS)).fetchall()
        context.prime(p for member in candidates for p in [*json.loads(member['ancestors']), member['path']])
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
                                  next_cursor=previous['next_cursor'], exploration=previous['exploration'])
        if meta['new_action']:
            if context.expansion and meta['phase'] != 'done':
                raise _expired()
            if context.expansion:
                member = _member(database, context.expansion)
                if member is None or _witness(context, member) is None:
                    raise _expired()
                if not database.execute('SELECT 1 FROM expansions WHERE path=?', (context.expansion,)).fetchone():
                    maximum = database.execute('SELECT COALESCE(MAX(id),0) FROM members').fetchone()[0]
                    database.execute('UPDATE members SET depth=?,done=0,after=?,mode=2', (depth, maximum))
                    # Explicit selection admits an independent expansion root
                    # only after its old witness has passed. New descendants
                    # carry this root's bounded depth witness on every page.
                    database.execute("UPDATE members SET depth=0,ancestors='[]',done=0,after=0,mode=0 WHERE path=?",
                                     (context.expansion,))
                    meta['pending'] = context.expansion
                    meta['phase'], meta['after'] = 'discover', 0
            else:
                # Visibility refresh revalidates and republishes accumulated
                # evidence without rediscovering any adjacency. The independent
                # pending expansion identity survives an aborted fetch.
                database.execute('UPDATE pairs SET emitted=0')
                meta['emitted'] = 0
                database.execute('UPDATE metadata SET emitted=0 WHERE id=1')
                meta['phase'], meta['after'] = ('discover' if meta['phase'] == 'discover' else 'edges'), 0
            meta['action'] = context.expansion or ''
        if meta['revision'] == 0:
            meta['pending'] = path
            node = context.eligible(path)
            if node:
                display = _filtered_nodes(context.generation, folder, tag, text).filter(path=path).exists()
                database.execute('INSERT INTO members(path,depth,ancestors,display) VALUES(?,0,\'[]\',?)',
                                 (path, int(display)))
        if meta['incomplete']:
            context.complete = False
            context.reasons.update(json.loads(meta['reasons']))
        if meta['phase'] == 'discover' and not (node_limit >= 2 and database.execute(
                'SELECT 1 FROM pairs WHERE emitted=0 LIMIT 1').fetchone()):
            _discover(context, database, meta, depth, folder, tag, text)
        nodes, edges = _emit(context, database, meta, node_limit, edge_limit)
        if meta['phase'] == 'discover':
            # Publish spare membership slots during discovery too. Confirmed
            # connections above already carry their full indexed aggregates.
            for member in database.execute('SELECT * FROM members WHERE id>? ORDER BY id LIMIT ?',
                                           (meta['emitted'], min(node_limit - len(nodes), WORK_ROWS))).fetchall():
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
        exploration = signing.dumps({'q': context.exploration_hash, 's': context.stamp, 'a': checkpoint},
                                    salt='graph-exploration-v1', compress=True)
        if not more:
            database.execute('INSERT OR IGNORE INTO expansions VALUES(?)', (meta['pending'] or path,))
        page = context.finish(GraphPage, nodes=tuple(nodes[p] for p in sorted(nodes)), edges=tuple(edges),
                              boundary_connections=bool(meta['boundary']),
                              next_cursor=context.cursor(checkpoint) if more else None, exploration=exploration)
        # A payload failure must not consume omitted work. The response asks
        # for smaller bounds; expiry keeps the abandoned state bounded in time.
        if 'payload_limit' in page.limiting_reasons:
            raise StorageError('graph_payload_limited', 503)
        persistent = context.reasons - {'page_limit', 'node_limit', 'edge_limit', 'candidate_limit', 'discovery_pending'}
        database.execute('UPDATE metadata SET revision=?,phase=?,after=?,incomplete=?,reasons=?,boundary=?,replay=?,action=?,pending=? WHERE id=1',
                         (checkpoint['after'], meta['phase'], meta['after'], int(bool(persistent)),
                          json.dumps(sorted(persistent)), meta['boundary'], json.dumps(asdict(page)), meta['action'], meta['pending']))
        return page
