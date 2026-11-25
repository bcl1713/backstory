"""Official SDK preview/save proof; portable synthetic fixtures, no task imports."""
import asyncio
from datetime import datetime, timezone
import hashlib
import json
import sqlite3
import tempfile

import pytest
from tests.native.test_stdio import ClientSession, stdio_client, environment, parameters


def need(value, code):
    if not value:
        raise AssertionError(code)


def bulletin():
    def bullet(size, lead):
        count, tail = divmod(size - len('- ' + lead), 5)
        return '- ' + lead + ' note' * count + ['', '.', ' a', ' ok', ' now'][tail]
    heading = '## Synthetic daily notes'
    fields = [heading, '', bullet(136, 'Synthetic capture alpha records ordinary reviewed work'),
              bullet(37, 'Synthetic context alpha'), '',
              bullet(159, 'Synthetic capture beta records ordinary completed work'),
              bullet(36, 'Synthetic context beta'), '', '']
    original = '\n'.join(fields)
    # Independently specified from the reviewed synthetic literal, not obtained
    # from production formatting or the preview being tested.
    expected = original
    for offset in (353, 278, 102):
        expected = expected[:offset] + '\n ' + expected[offset:]
    need(hashlib.sha256(expected.encode()).hexdigest() ==
         'ce35b36be5f49f973501da1a780f40d81b409ec77b3edf793d635e7ea7bfeeed', 'independent_wrapped_oracle')
    return heading + '\n\n', original, expected


def accounting(data):
    with sqlite3.connect(data / 'backstory.sqlite3') as db:
        return {table: db.execute('SELECT * FROM ' + table + ' ORDER BY id').fetchall()
                for table in ('wiki_savedrevision', 'wiki_formatrecovery', 'indexing_indexjob', 'indexing_scanstate')}


@pytest.mark.parametrize('newline,bom', [('\n', b''), ('\r\n', b'\xef\xbb\xbf')])
def test_sdk_preview_then_edit(tmp_path, newline, bom):
    wiki, data, env = environment(tmp_path)
    env['BACKSTORY_WIKI_TIMEZONE'] = 'UTC'
    if newline == '\r\n':
        (wiki / '.prettierrc.json').write_text('{"endOfLine":"crlf","proseWrap":"always"}')
    today = datetime.now(timezone.utc).date().isoformat()
    anchor, replacement, canonical = (s.replace('\n', newline) for s in bulletin())
    source = ('---\ntitle: Synthetic daily\nmodified: 2000-01-01\n---\n\n# Synthetic daily\n\n'
              'Preserved leading paragraph.\n\n' + bulletin()[0] + 'Preserved neighboring paragraph.\n\n'
              '## Earlier entries\n\n- Prior synthetic entry stays unchanged.\n').replace('\n', newline)
    raw = bom + source.encode()
    path = 'daily.md'
    (wiki / path).write_bytes(raw)

    async def check():
        with tempfile.TemporaryFile(mode='w+') as errors:
            async with stdio_client(parameters(wiki, data, env), errlog=errors) as (read, write):
                async with ClientSession(read, write) as client:
                    hello = await client.initialize()
                    tools = {t.name: t for t in (await client.list_tools()).tools}

                    async def call(name, args):
                        result = await client.call_tool(name, args)
                        return result, json.loads(result.content[0].text)

                    _, note = await call('read_note', {'path': path})
                    revision = '"' + hashlib.sha256(raw).hexdigest() + '"'
                    need(note['authoritative'] and note['revision'] == revision, 'base_authority')
                    before = accounting(data)
                    stat = (wiki / path).stat()
                    args = {'path': path, 'revision': note['revision'], 'old_text': anchor, 'new_text': replacement}
                    result, preview = await call('preview_edit_note', args)
                    print(json.dumps({'preview_discovered': 'preview_edit_note' in tools,
                        'state': preview['state'], 'reason': preview.get('reason_code')}), flush=True)
                    need('preview_edit_note' in tools and not result.is_error and preview['state'] == 'preview', 'registered_preview_missing_or_refused')
                    need(tools['preview_edit_note'].annotations.read_only_hint is True and
                         tools['preview_edit_note'].annotations.destructive_hint is False, 'readonly_annotation')
                    need(preview['authoritative'] and preview['revision'] == revision and preview['new_text'] == canonical,
                         'bounded_exact_independent_preview_literal')
                    need(not {'source', 'diff', 'diagnostics', 'old_text', 'recovery_token'} & preview.keys(), 'no_body_echo')
                    need((wiki / path).read_bytes() == raw and (wiki / path).stat().st_mtime_ns == stat.st_mtime_ns
                         and accounting(data) == before, 'preview_no_note_revision_backup_recovery_or_real_queue_mutation')
                    _, reread = await call('read_note', {'path': path})
                    need(reread['authoritative'] and reread['revision'] == revision and reread['source'] == source, 'preview_unchanged_authoritative_read')
                    result, saved = await call('edit_note', {**args, 'new_text': preview['new_text']})
                    expected = bom + source.replace(anchor, canonical, 1).replace('modified: 2000-01-01', 'modified: ' + today, 1).encode()
                    _, reread = await call('read_note', {'path': path})
                    need(not result.is_error and saved['authoritative'] and saved['state'] in {'saved', 'saved_index_delayed'}
                         and (wiki / path).read_bytes() == expected and bom + reread['source'].encode() == expected,
                         'verbatim_edit_exact_expected_splice_plus_managed_date')
                    need(saved['revision'] == reread['revision'] == '"' + hashlib.sha256(expected).hexdigest() + '"', 'new_authoritative_revision')
                    with sqlite3.connect(data / 'backstory.sqlite3') as db:
                        backups = db.execute('SELECT path,base_revision,original FROM wiki_savedrevision').fetchall()
                        jobs = db.execute('SELECT path,revision FROM indexing_indexjob').fetchall()
                    need(backups == [(path, revision, raw)] and jobs == [(path, saved['revision'])], 'positive_save_backup_and_actual_queue')
                    ids = ['Synthetic capture alpha', 'Synthetic capture beta']
                    need(all(reread['source'].count(i) == 1 for i in ids) and
                         reread['source'].index(ids[0]) < reread['source'].index(ids[1]), 'both_entries_ids_and_order')
                    need(datetime.now(timezone.utc).date().isoformat() == today, 'no_midnight_boundary')
                    print(json.dumps({'protocol': hello.protocol_version, 'tools': len(tools),
                        'newline': 'crlf' if bom else 'lf', 'returned_bytes': len(canonical.encode()),
                        'readonly_accounting_unchanged': True, 'exact_save_managed_date_and_ids': True,
                        'backup_delta': 1, 'real_index_job_matches_revision': True}), flush=True)
    asyncio.run(check())


def test_sdk_preview_refusals_and_intervening_changes(tmp_path):
    wiki, data, env = environment(tmp_path)
    env['BACKSTORY_WIKI_TIMEZONE'] = 'UTC'
    anchor, replacement, _ = bulletin()
    source = '# Synthetic daily\n\n' + anchor + 'Preserved neighboring paragraph.\n'
    path = 'guard.md'
    raw = source.encode()
    (wiki / path).write_bytes(raw)

    async def check():
        with tempfile.TemporaryFile(mode='w+') as errors:
            async with stdio_client(parameters(wiki, data, env), errlog=errors) as (read, write):
                async with ClientSession(read, write) as client:
                    await client.initialize()

                    async def call(name, args):
                        result = await client.call_tool(name, args)
                        return result, json.loads(result.content[0].text)

                    _, initial = await call('read_note', {'path': path})
                    args = {'path': path, 'revision': initial['revision'], 'old_text': anchor, 'new_text': replacement}

                    async def refused(arguments, reason, name='preview_edit_note'):
                        current = (wiki / path).read_bytes()
                        before = accounting(data)
                        result, value = await call(name, arguments)
                        need(result.is_error and value['reason_code'] == reason, 'expected_' + reason)
                        need(not {'new_text', 'source', 'old_text', 'diff', 'diagnostics', 'recovery_token'} & value.keys(), 'refusal_no_echo')
                        need((wiki / path).read_bytes() == current and accounting(data) == before, 'refusal_accounting_unchanged')

                    await refused({**args, 'revision': '"' + '0' * 64 + '"'}, 'revision_conflict')
                    await refused({**args, 'old_text': 'absent'}, 'edit_no_match')
                    await refused({**args, 'path': '../outside.md'}, 'path_denied')
                    await refused({**args, 'actor': 'client'}, 'invalid_arguments')
                    await refused({**args, 'new_text': 'é' * 2049}, 'invalid_arguments')
                    await refused({**args, 'new_text': '- ' + 'word ' * 818 + '\n\n'}, 'edit_preview_too_large')
                    for body, needle in [('# Guard\n\naaaa\n', 'aaa'), ('# Guard\n\nword word\n', 'word')]:
                        (wiki / path).write_bytes(body.encode())
                        _, current = await call('read_note', {'path': path})
                        await refused({**args, 'revision': current['revision'], 'old_text': needle}, 'edit_ambiguous')
                    outside = '# Guard\n\n-   unrelated\n\n' + anchor + 'Tail.\n'
                    (wiki / path).write_bytes(outside.encode())
                    _, current = await call('read_note', {'path': path})
                    await refused({**args, 'revision': current['revision']}, 'edit_would_change_other_content')
                    (wiki / path).write_bytes(raw)
                    _, current = await call('read_note', {'path': path})
                    args['revision'] = current['revision']
                    result, preview = await call('preview_edit_note', args)
                    need(not result.is_error, 'preview_before_external_note_change')
                    changed = raw.replace(b'Preserved neighboring', b'Changed neighboring')
                    (wiki / path).write_bytes(changed)
                    await refused({**args, 'new_text': preview['new_text']}, 'revision_conflict', 'edit_note')
                    _, changed_read = await call('read_note', {'path': path})
                    need(changed_read['revision'] != args['revision'], 'actual_intervening_revision_changed')
                    (wiki / path).write_bytes(raw)
                    result, preview = await call('preview_edit_note', args)
                    need(not result.is_error, 'preview_before_settings_change')
                    (wiki / '.prettierrc.json').write_text('{"printWidth":40,"proseWrap":"always"}')
                    await refused({**args, 'new_text': preview['new_text']}, 'edit_would_change_other_content', 'edit_note')
                    before = accounting(data)
                    result, new_preview = await call('preview_edit_note', args)
                    need(not result.is_error and new_preview['formatter_config'] != preview['formatter_config']
                         and new_preview['new_text'] != preview['new_text'] and accounting(data) == before,
                         'actual_new_destination_settings_not_incidental_refusal')
                    print(json.dumps({'new_preview_refusals': 'stale_missing_overlap_duplicate_outside_path_utf8_growth',
                        'intervening_note_guard': 'revision_conflict', 'intervening_settings_guard': 'edit_would_change_other_content',
                        'all_refusals_readonly': True}), flush=True)
    asyncio.run(check())
