"""Real SDK transport proof; all application setup occurs in isolated children."""
import asyncio
import os
from pathlib import Path
import subprocess
import sys

import pytest
pytest.importorskip('mcp', reason='optional native-mcp extra is required for SDK transport proof')

from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

REPO = Path(__file__).resolve().parents[2]


def environment(tmp_path):
    wiki = tmp_path / 'wiki'
    wiki.mkdir()
    (wiki / '.backstory-marker').touch()
    data = tmp_path / 'data'
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(wiki),
           'BACKSTORY_DATA_DIR': str(data), 'BACKSTORY_ALLOWED_HOSTS': 'localhost',
           'BACKSTORY_COOKIE_MODE': 'localhost', 'DJANGO_SETTINGS_MODULE': 'backstory.settings'}
    subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], cwd=REPO,
                   env=env, check=True, capture_output=True)
    return wiki, data, env


def parameters(wiki, data, env):
    return StdioServerParameters(command=sys.executable,
        args=['-m', 'backstory.native_mcp', '--stdio', '--wiki-root', str(wiki), '--data-dir', str(data)],
        cwd=str(REPO), env=env)


@pytest.mark.parametrize('newline,bom', [('\n', False), ('\r\n', True)])
def test_targeted_large_note_edit_over_stdio(tmp_path, newline, bom):
    import hashlib
    import json
    import sqlite3
    wiki, data, env = environment(tmp_path)
    if newline == '\r\n':
        (wiki / '.prettierrc.json').write_text('{"endOfLine":"crlf"}')

    def backup_rows():
        with sqlite3.connect(data / 'backstory.sqlite3') as db:
            return db.execute('SELECT base_revision, original FROM wiki_savedrevision ORDER BY id').fetchall()

    async def check():
        async with stdio_client(parameters(wiki, data, env)) as (read, write):
            async with ClientSession(read, write) as client:
                await client.initialize()
                tools = {tool.name: tool for tool in (await client.list_tools()).tools}
                assert 'edit_note' in tools, 'registered bounded literal edit is missing'
                assert tools['edit_note'].annotations.read_only_hint is False

                async def call(name, args):
                    result = await client.call_tool(name, args)
                    return result, json.loads(result.content[0].text)

                source = ('# Synthetic large note\n\n' + 'A stable synthetic sentence.\n\n' * 1280 + 'MARKER-A\n').replace('\n', newline)
                await call('create_note', {'path': 'large.md', 'source': ('\ufeff' if bom else '') + source})
                _, initial = await call('read_note', {'path': 'large.md'})
                before = (wiki / 'large.md').read_bytes()
                assert 36 * 1024 <= len(before) <= 42 * 1024
                assert initial['authoritative'] and initial['revision'] == '"' + hashlib.sha256(before).hexdigest() + '"'
                assert before.startswith(b'\xef\xbb\xbf') == bom
                rows = backup_rows()
                result, edited = await call('edit_note', {'path': 'large.md', 'revision': initial['revision'],
                                                        'old_text': 'MARKER-A', 'new_text': 'MARKER-B'})
                assert not result.is_error and edited['authoritative']
                assert edited['state'] in {'saved', 'saved_index_delayed'}
                assert edited['indexing']['state'] in {'queued', 'delayed'}
                assert edited['index']['state'] in {'ready', 'partial', 'stale', 'backoff', 'unavailable'}
                assert len(json.dumps(edited)) < 768
                assert not {'source', 'diff', 'diagnostics', 'recovery_token', 'old_text', 'new_text'} & edited.keys()
                expected = before.replace(b'MARKER-A', b'MARKER-B', 1)
                assert (wiki / 'large.md').read_bytes() == expected
                _, readback = await call('read_note', {'path': 'large.md'})
                assert readback['authoritative'] and readback['revision'] == edited['revision']
                assert edited['revision'] == '"' + hashlib.sha256(expected).hexdigest() + '"'
                assert len(backup_rows()) == len(rows) + 1
                assert backup_rows()[-1] == (initial['revision'], before)

                async def refused(args, reason):
                    path = args.get('path', 'large.md')
                    old_bytes = (wiki / path).read_bytes() if path in {'large.md', 'overlap.md', 'format.md', 'metadata.md'} else None
                    old_rows = backup_rows()
                    outcome, value = await call('edit_note', args)
                    assert outcome.is_error and value['reason_code'] == reason
                    assert not {'source', 'diff', 'diagnostics', 'recovery_token', 'old_text', 'new_text'} & value.keys()
                    assert len(json.dumps(value)) < 768 and backup_rows() == old_rows
                    if args.get('path') in {'large.md', 'overlap.md', 'format.md', 'metadata.md'}:
                        assert (wiki / args['path']).read_bytes() == old_bytes
                    return value

                args = {'path': 'large.md', 'revision': edited['revision'], 'old_text': 'MARKER-B', 'new_text': 'MARKER-C'}
                await refused({**args, 'revision': initial['revision']}, 'revision_conflict')
                await refused({**args, 'old_text': 'absent-needle'}, 'edit_no_match')
                await refused({**args, 'old_text': 'synthetic'}, 'edit_ambiguous')
                for change in ({'old_text': ''}, {'old_text': 'x' * 4097}, {'new_text': 'é' * 4096},
                               {'revision': '*'}, {'actor': 'browser'}):
                    await refused({**args, **change}, 'invalid_arguments')
                await refused({**args, 'path': '../outside.md'}, 'path_denied')
                for path, body, needle, reason in (
                    ('overlap.md', '# Overlap\n\naaaa\n', 'aaa', 'edit_ambiguous'),
                    ('format.md', '# Format\n\n-   unstable\n\nMARKER-A\n', 'MARKER-A', 'edit_would_change_other_content'),
                    ('metadata.md', '---\ntitle: Before\nmodified: 2000-01-01\n---\n\n# Metadata\n\nMARKER-A\n', 'Before', 'edit_would_change_other_content')):
                    (wiki / path).write_bytes(body.replace('\n', newline).encode())
                    _, current = await call('read_note', {'path': path})
                    await refused({'path': path, 'revision': current['revision'], 'old_text': needle, 'new_text': 'replacement'}, reason)
                print(json.dumps({'note_bytes': len(before), 'bom': bom, 'newline': 'crlf' if bom else 'lf',
                    'discovered_edit': True, 'authoritative_new_revision': True, 'outside_span_bytes_unchanged': True,
                    'normal_backup_count_delta': 1, 'indexing': edited['indexing']['state'],
                    'observed_index': edited['index']['state'], 'compact_reply_bytes': len(json.dumps(edited)),
                    'stale_missing_ambiguous_overlap_and_normalization_refused_without_backup': True}))
    asyncio.run(check())


def test_initialize_and_discover(tmp_path):
    wiki, data, env = environment(tmp_path)

    async def check():
        async with stdio_client(parameters(wiki, data, env)) as (read, write):
            async with ClientSession(read, write) as session:
                initialized = await session.initialize()
                tools = await session.list_tools()
                assert 'wiki_status' in {tool.name for tool in tools.tools}
                assert initialized.protocol_version
                import importlib.metadata
                import json
                print('handshake:', json.dumps({'protocol': initialized.protocol_version,
                      'sdk': importlib.metadata.version('mcp'), 'python': sys.version.split()[0],
                      'executable': sys.executable, 'server': initialized.server_info.model_dump()}))
    asyncio.run(check())


def test_guarded_lifecycle_over_stdio(tmp_path):
    """Catches missing dispatch/guards, silent replay and non-durable recovery."""
    import base64
    import hashlib
    import json
    wiki, data, env = environment(tmp_path)
    expected = {'wiki_status', 'list_notes', 'search_notes', 'read_note', 'read_notes',
                'create_folder', 'create_note', 'save_note', 'edit_note', 'preview_edit_note', 'preview_move', 'get_move',
                'commit_move', 'rollback_move', 'preview_removal', 'get_removal',
                'commit_removal', 'restore_removal', 'list_note_history',
                'read_note_revision', 'restore_note_revision', 'get_note_links',
                'get_note_graph', 'get_graph_snapshot', 'find_link_issues',
                'get_index_diagnostics', 'upload_file', 'inspect_upload', 'list_operations'}

    async def check():
        async with stdio_client(parameters(wiki, data, env)) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                assert {tool.name for tool in (await session.list_tools()).tools} == expected

                async def call(name, **args):
                    result = await session.call_tool(name, args)
                    assert len(result.content) == 1
                    value = json.loads(result.content[0].text)
                    assert value['untrusted_content'] is True
                    if name == 'get_removal' and value['state'] == 'removed':
                        assert result.is_error is False
                    return value

                assert (await call('wiki_status'))['state'] in {'ok', 'partial'}
                assert (await call('create_folder', path='work'))['state'] == 'created'
                assert (await call('create_folder', path='assets'))['state'] == 'created'
                assert (await call('create_folder', path='archive'))['state'] == 'created'
                made = await call('create_note', path='work/a.md', source='# Alpha\n')
                assert made['state'] in {'created', 'created_index_delayed'} and made['authoritative']
                first = await call('read_note', path='work/a.md')
                original = (wiki / 'work/a.md').read_bytes()
                assert first['source'].endswith('# Alpha\n')
                assert first['revision'] == '"' + hashlib.sha256(original).hexdigest() + '"'
                assert (await call('create_note', path='work/a.md', source='# Collision\n'))['state'] == 'conflict'
                assert (wiki / 'work/a.md').read_bytes() == original
                saved = await call('save_note', path='work/a.md', source='# Beta\n', revision=first['revision'])
                assert saved['state'] in {'saved', 'saved_index_delayed'} and saved['authoritative']
                after = (wiki / 'work/a.md').read_bytes()
                stale = await call('save_note', path='work/a.md', source='# Stale\n', revision=first['revision'])
                assert stale['state'] == 'conflict'
                assert (wiki / 'work/a.md').read_bytes() == after
                assert (await call('read_note', path='work/a.md'))['revision'] == saved['revision']
                batch = await call('read_notes', paths=['work/a.md', 'missing.md', '../outside.md'])
                assert [item['state'] for item in batch['results']] == ['ok', 'missing', 'denied']
                assert (await call('list_notes', folder='work', limit=1))['entries'][0]['path'] == 'work/a.md'
                for path in ('../outside.md', '/etc/passwd', 'AGENTS.md', '.env', 'assets/hidden.md'):
                    if path == 'assets/hidden.md':
                        continue  # ordinary Markdown is governed by policy, not folder spelling
                    assert (await call('read_note', path=path))['state'] == 'error'
                (wiki / 'linked.md').symlink_to(wiki / 'work/a.md')
                assert (await call('read_note', path='linked.md'))['state'] == 'error'
                assert (await call('create_folder', path='../escape'))['state'] == 'error'
                assert (await call('save_note', path='work/a.md', source='# Invalid\n', revision='*'))['state'] == 'error'
                assert (await call('create_note', path='work/new.md', source='# X\n', actor='browser'))['state'] == 'error'
                assert not (wiki / 'work/new.md').exists()
                history = await call('list_note_history', path='work/a.md', limit=1)
                revision_id = history['items'][0]['revision_id']
                historical = await call('read_note_revision', revision_id=revision_id)
                assert historical['source'].encode() == original and historical['authoritative'] is False
                restored = await call('restore_note_revision', path='work/a.md', revision_id=revision_id, revision=saved['revision'])
                assert restored['authoritative'] and (wiki / 'work/a.md').read_bytes() == original

                assert (await call('create_note', path='ref.md', source='# Reference\n\n[[work/a]]\n'))['authoritative']
                # Explicit synthetic maintenance, bounded to this two-note corpus.
                maintenance = '''import django
django.setup()
from indexing.worker import run_batch
for _ in range(25):
    batch = run_batch()
    if not batch.pending:
        break
else:
    raise AssertionError('synthetic index did not settle in 25 bounded batches')
'''
                subprocess.run([sys.executable, '-c', maintenance], cwd=REPO,
                               env=env, check=True, capture_output=True)
                search = await call('search_notes', query='Alpha', limit=1)
                assert search['state'] == 'matches'
                assert search['items'][0]['path'] == 'work/a.md'
                assert search['authoritative'] is False
                for name, args in (
                    ('get_note_links', {'path': 'work/a.md', 'direction': 'both', 'limit': 1}),
                    ('get_note_graph', {'path': 'work/a.md', 'depth': 1, 'node_limit': 2, 'edge_limit': 2}),
                    ('get_graph_snapshot', {}), ('find_link_issues', {'limit': 1}),
                    ('get_index_diagnostics', {'limit': 1})):
                    graph_result = await call(name, **args)
                    assert graph_result['state'] not in {'error', 'unavailable'}
                    if name == 'get_note_links':
                        assert graph_result['items'][0]['source'] == 'ref.md'
                        assert graph_result['items'][0]['destination'] == 'work/a.md'
                    if name == 'get_graph_snapshot':
                        assert {node['path'] for node in graph_result['nodes']} == {'work/a.md', 'ref.md'}
                        assert graph_result['projection_complete']

                preview = await call('preview_move', source='work/a.md', destination='work/b.md')
                assert preview['state'] == 'preview' and preview['inventory'] and preview['review_token']
                op = preview['operation_id']
                assert (await call('get_move', operation_id=op))['state'] == 'preview'
                assert (await call('commit_move', operation_id=op, review_token='tampered'))['state'] == 'error'
                assert (wiki / 'work/a.md').exists() and not (wiki / 'work/b.md').exists()
                moved = await call('commit_move', operation_id=op, review_token=preview['review_token'])
                assert moved['state'] == 'completed' and moved['authoritative']
                assert not (wiki / 'work/a.md').exists() and (wiki / 'work/b.md').read_bytes() == original
                assert '[[work/b]]' in (wiki / 'ref.md').read_text()
                assert (await call('get_move', operation_id=op))['state'] == 'completed'
                cancelled = await call('preview_move', source='work/b.md', destination='work/c.md')
                assert (await call('rollback_move', operation_id=cancelled['operation_id']))['state'] == 'cancelled'
                assert (wiki / 'work/b.md').exists() and not (wiki / 'work/c.md').exists()
                archived = await call('preview_move', source='work/b.md', destination='archive/b.md')
                assert (await call('commit_move', operation_id=archived['operation_id'], review_token=archived['review_token']))['authoritative']
                current = await call('read_note', path='archive/b.md')
                assert current['source'].encode() == original
                collision = await call('preview_move', source='archive/b.md', destination='archive/b.md')
                assert collision['state'] == 'error'
                removal = await call('preview_removal', path='archive/b.md', kind='note', revision=current['revision'])
                rid = removal['operation_id']
                assert (await call('get_removal', operation_id=rid))['state'] == 'preview'
                removed = await call('commit_removal', operation_id=rid)
                assert removed['state'] == 'removed' and removed['authoritative']
                assert not (wiki / 'archive/b.md').exists()
                assert (await call('read_note', path='archive/b.md'))['reason_code'] == 'not_found'
                assert (await call('get_removal', operation_id=rid))['state'] == 'removed'
                # Inspection did not recreate anything; restore is a separate deliberate call.
                assert not (wiki / 'archive/b.md').exists()
                folder = await call('preview_removal', path='archive', kind='folder')
                fid = folder['operation_id']
                assert (await call('commit_removal', operation_id=fid))['state'] == 'removed'
                assert not (wiki / 'archive').exists()
                assert (await call('restore_removal', operation_id=rid))['state'] == 'error'
                assert (await call('restore_removal', operation_id=fid))['authoritative']
                assert (await call('restore_removal', operation_id=rid))['authoritative']
                assert (wiki / 'archive/b.md').read_bytes() == original
                assert (await call('preview_removal', path='archive', kind='folder'))['state'] == 'error'
                second = await call('preview_removal', path='archive/b.md', kind='note', revision=current['revision'])
                assert (await call('commit_removal', operation_id=second['operation_id']))['state'] == 'removed'
                # A real colliding entry, including identical bytes, must never be adopted.
                (wiki / 'archive/b.md').write_bytes(original)
                collision_result = await session.call_tool('restore_removal', {'operation_id': second['operation_id']})
                assert collision_result.is_error is True
                refused = json.loads(collision_result.content[0].text)
                assert refused['state'] == 'removed' and refused['reason_code'] == 'removal_restore_collision'
                assert refused['authoritative'] is False
                assert (wiki / 'archive/b.md').read_bytes() == original

                payload = b'synthetic attachment\x00\xff'
                digest = hashlib.sha256(payload).hexdigest()
                assert (await call('inspect_upload', filename='proof.bin', sha256=digest))['state'] == 'absent'
                upload = await call('upload_file', filename='proof.bin', data_base64=base64.b64encode(payload).decode())
                assert upload['state'] == 'created' and upload['authoritative']
                assert (wiki / upload['path']).read_bytes() == payload
                assert (await call('inspect_upload', filename='proof.bin', sha256=digest))['state'] == 'confirmed'
                assert len(list((wiki / 'assets').iterdir())) == 1
                assert (await call('upload_file', filename='proof.bin', data_base64='Zg==='))['state'] == 'error'
                print('lifecycle: 29 tools, authoritative disk/recovery checks, stale/path/collision refusals')
    asyncio.run(check())


def test_definite_write_refusal_sets_sdk_error(tmp_path):
    """A failed formatter must not be reported as a successful MCP action."""
    import json
    wiki, data, env = environment(tmp_path)

    async def check():
        async with stdio_client(parameters(wiki, data, env)) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool('create_note', {'path': 'bad.md', 'source': '---\nbroken: [\n---\n'})
                value = json.loads(result.content[0].text)
                assert value['state'] == 'format_failed'
                assert result.is_error is True
                assert not (wiki / 'bad.md').exists()
    asyncio.run(check())


def test_cancelled_preview_reply_can_be_found_without_replaying(tmp_path):
    """Recover a lost UUID over real SDK stdio without starting another preview."""
    import json
    import sqlite3
    wiki, data, env = environment(tmp_path)
    # Test-only delay after real durable preview publication; no product fault flag.
    launcher = '''import asyncio, time
from backstory import native_mcp
native_mcp.configure()
import django
django.setup()
from wiki import native_service
original = native_service._dispatch
def delay_reply(access, name, args):
    result = original(access, name, args)
    if name in {'preview_move', 'preview_removal'}:
        time.sleep(.4)
    return result
native_service._dispatch = delay_reply
asyncio.run(native_mcp.serve())
'''
    params = parameters(wiki, data, env)
    params.args = ['-c', launcher, *params.args[2:]]

    def count(kind):
        table = {'move': 'wiki_moveoperation', 'removal': 'wiki_removaloperation'}[kind]
        with sqlite3.connect(data / 'backstory.sqlite3') as db:
            return db.execute('SELECT COUNT(*) FROM ' + table).fetchone()[0]

    async def check():
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                async def call(name, args):
                    result = await session.call_tool(name, args)
                    return result, json.loads(result.content[0].text)

                _, made = await call('create_note', {'path': 'a.md', 'source': '# A\n'})
                for kind, name, args in (
                    ('move', 'preview_move', {'source': 'a.md', 'destination': 'b.md'}),
                    ('removal', 'preview_removal', {'path': 'a.md', 'kind': 'note', 'revision': made['revision']})):
                    pending = asyncio.create_task(session.call_tool(name, args))
                    for _ in range(200):
                        if count(kind) == 1:
                            break
                        await asyncio.sleep(.01)
                    else:
                        pytest.fail('preview did not publish within bounded wait')
                    # Cancellation loses the response before it contains an operation ID.
                    pending.cancel()
                    with pytest.raises(asyncio.CancelledError):
                        await pending
                    overlap, busy = await call('wiki_status', {})
                    assert busy['request_started'] is False and busy['queued'] is False
                    assert overlap.is_error is True
                    await asyncio.sleep(.5)  # only the injected acknowledgement delay
                    result, listing = await call('list_operations', {'kind': kind, 'limit': 1})
                    assert result.is_error is False and listing['state'] == 'ok'
                    assert listing['authoritative'] is False
                    assert len(listing['items']) == 1
                    item = listing['items'][0]
                    assert item['state'] == 'preview' and item['kind'] == kind
                    assert not {'original', 'source_bytes', 'plan', 'review_token'} & item.keys()
                    inspected, view = await call('get_move' if kind == 'move' else 'get_removal', {'operation_id': item['operation_id']})
                    assert inspected.is_error is False and view['state'] == 'preview'
                    assert count(kind) == 1 and (wiki / 'a.md').exists() and not (wiki / 'b.md').exists()
    asyncio.run(check())
