"""Narrow existing-date exception; real registered transport and parser boundaries."""
import asyncio
from datetime import datetime, timezone
import hashlib
import json
import sqlite3
import tempfile

import pytest

from tests.native.test_stdio import ClientSession, stdio_client, environment, parameters


def require(value, code):
    if not value:
        raise AssertionError(code)


@pytest.mark.parametrize('newline,bom', [('\n', b''), ('\r\n', b'\xef\xbb\xbf')])
def test_stale_modified_large_edit(tmp_path, newline, bom):
    wiki, data, env = environment(tmp_path)
    env['BACKSTORY_WIKI_TIMEZONE'] = 'UTC'
    today = datetime.now(timezone.utc).date().isoformat()
    if newline == '\r\n':
        (wiki / '.prettierrc.json').write_text('{"endOfLine":"crlf"}')
    source = ('---\ntitle: Synthetic nightly\nmodified: 2000-01-01\n---\n\n# Synthetic nightly\n\n'
              + 'A stable synthetic sentence.\n\n' * 1280 + '## Nightly log\n\nExisting entry.\n').replace('\n', newline)
    raw = bom + source.encode()
    require(36 * 1024 <= len(raw) <= 42 * 1024, 'large_note')
    (wiki / 'large.md').write_bytes(raw)
    anchor = '## Nightly log\n\n'.replace('\n', newline)
    replacement = anchor + '### Synthetic entry\n\n- Added synthetic item.\n\n'.replace('\n', newline)
    expected = bom + source.replace(anchor, replacement, 1).replace('modified: 2000-01-01', 'modified: ' + today, 1).encode()

    def backups():
        with sqlite3.connect(data / 'backstory.sqlite3') as db:
            return db.execute('SELECT path, base_revision, original FROM wiki_savedrevision ORDER BY id').fetchall()

    async def check():
        with tempfile.TemporaryFile(mode='w+') as errors:
            async with stdio_client(parameters(wiki, data, env), errlog=errors) as (read, write):
                async with ClientSession(read, write) as client:
                    hello = await client.initialize()
                    require(len((await client.list_tools()).tools) == 29, 'discovery')

                    async def call(name, args):
                        result = await client.call_tool(name, args)
                        value = json.loads(result.content[0].text)
                        if name == 'edit_note':
                            require(len(json.dumps(value)) < 768 and not
                                {'source', 'diff', 'diagnostics', 'old_text', 'new_text', 'recovery_token'} & value.keys(), 'compact')
                        return result, value

                    _, before = await call('read_note', {'path': 'large.md'})
                    revision = '"' + hashlib.sha256(raw).hexdigest() + '"'
                    require(before['authoritative'] and before['revision'] == revision, 'base_authority')
                    rows = backups()
                    args = {'path': 'large.md', 'revision': revision, 'old_text': anchor, 'new_text': replacement}
                    result, saved = await call('edit_note', args)
                    require(not result.is_error and saved['state'] in {'saved', 'saved_index_delayed'}, 'stale_date_should_save')
                    require((wiki / 'large.md').read_bytes() == expected, 'exact_splice_plus_date_only')
                    require(len(backups()) == len(rows) + 1 and backups()[-1] == ('large.md', revision, raw), 'one_original_backup')
                    _, reread = await call('read_note', {'path': 'large.md'})
                    require(saved['authoritative'] and reread['authoritative'] and
                            saved['revision'] == reread['revision'] == '"' + hashlib.sha256(expected).hexdigest() + '"', 'new_authority')
                    result, stale = await call('edit_note', args)
                    require(result.is_error and stale['reason_code'] == 'revision_conflict' and
                            (wiki / 'large.md').read_bytes() == expected and len(backups()) == len(rows) + 1, 'stale_no_write_or_backup')
                    for label, old, new in [
                        ('format', anchor, replacement.replace('- Added', '-   Added')),
                        ('title', 'title: Synthetic nightly', 'title: Changed nightly'),
                        ('overlap', 'modified: 2000-01-01', 'modified: 1999-01-01'),
                    ]:
                        path = label + '.md'
                        (wiki / path).write_bytes(raw)
                        _, current = await call('read_note', {'path': path})
                        prior = backups()
                        result, refused = await call('edit_note', {'path': path, 'revision': current['revision'],
                                                                  'old_text': old, 'new_text': new})
                        require(result.is_error and refused['reason_code'] == 'edit_would_change_other_content', label + '_refusal')
                        _, reread = await call('read_note', {'path': path})
                        require((wiki / path).read_bytes() == raw and backups() == prior and
                                reread['revision'] == current['revision'], label + '_no_write_or_backup')
                    require(datetime.now(timezone.utc).date().isoformat() == today, 'no_midnight_crossing')
                    print(json.dumps({'note_bytes': len(raw), 'bom': bool(bom), 'newline': 'crlf' if bom else 'lf',
                        'protocol': hello.protocol_version, 'tools': 29, 'exact_splice_plus_existing_date': True,
                        'normal_backup_delta': 1, 'authoritative_new_revision': True, 'indexing': saved['indexing']['state'],
                        'stale_format_title_overlap_no_write_or_backup': True}))
    asyncio.run(check())


@pytest.mark.parametrize('scalar', ['2000-01-01', "'2000-01-01'", '"2000-01-01"'])
def test_date_allowance_preserves_quote_comment_newline(scalar):
    from wiki.save_metadata import literal_edit_with_modified
    source = '---\r\nmodified: ' + scalar + ' # retained\r\n---\r\n\r\nanchor\r\n'
    at = source.index('anchor')
    expected = source.replace('anchor', 'replacement').replace('2000-01-01', '2026-01-02')
    assert literal_edit_with_modified(source, at, at + 6, 'replacement', '2026-01-02') == expected


@pytest.mark.parametrize('header,old,new', [
    ('title: Only', 'anchor', 'replacement'),
    ('modified: 2000-01-01\nmodified: 1999-01-01', 'anchor', 'replacement'),
    ('modified: &date 2000-01-01\nalias: *date', 'anchor', 'replacement'),
    ('date: &date 2000-01-01\nmodified: *date', 'anchor', 'replacement'),
    ('modified: !!str 2000-01-01', 'anchor', 'replacement'),
    ('!!map\nmodified: 2000-01-01', 'anchor', 'replacement'),
    ('"modified": 2000-01-01', 'anchor', 'replacement'),
    ('modified: |\n  2000-01-01', 'anchor', 'replacement'),
    ('{modified: 2000-01-01}', 'anchor', 'replacement'),
    ('modified: 2000-01-01', '2000-01-01', '1999-01-01'),
    ('modified: 2000-01-01 # retained', 'retained', 'changed'),
    ('modified: 2000-01-01', 'modified', 'changed'),
    ('title: Only', 'anchor', '---\nmodified: 2000-01-01\n---'),
])
def test_date_allowance_cannot_rebind_original_field(header, old, new):
    from wiki.save_metadata import literal_edit_with_modified
    from wiki.metadata import MetadataError
    source = '---\n' + header + '\n---\n\nanchor\n'
    at = source.index(old)
    try:
        value = literal_edit_with_modified(source, at, at + len(old), new, '2026-01-02')
    except MetadataError:
        value = None
    assert value is None
