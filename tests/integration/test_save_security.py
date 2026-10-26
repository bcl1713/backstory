"""Both save modes meet the same policy/readiness/backup/I/O boundary, UID1002."""
import errno
import os
import pytest
from django.contrib.auth import get_user_model
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_saves import save, revision

pytestmark = pytest.mark.django_db


def attempt(reader, path, base, source, mode):
    token = None
    if mode == 'source_recovery':
        from wiki.revisions import issue_recovery
        from wiki.contracts import FormatResult, Diagnostic
        actor = get_user_model().objects.get(username='synthetic-reader')
        token = issue_recovery(actor, path, base, source, FormatResult(source, (Diagnostic('synthetic_failure', 'Synthetic failure'),), '', 'failed', ''))
    return save(reader, source, base, path=path, mode=mode, token=token)


@pytest.mark.parametrize('mode', ['formatted', 'source_recovery'])
@pytest.mark.parametrize('path', ['AGENTS.md', '.hidden/note.md', '../escape.md', 'notes/../../escape.md', '/absolute.md', 'secrets.md', 'notes/link/note.md', 'link/note.md', 'link.md', 'special.md'])
def test_both_modes_deny_hostile_paths(reader, wiki, mode, path):
    (wiki/'notes').mkdir(); (wiki/'notes/note.md').write_bytes(b'# Original\n')
    (wiki/'notes/link').symlink_to(wiki/'notes', target_is_directory=True)
    (wiki/'link').symlink_to(wiki/'notes', target_is_directory=True)
    (wiki/'link.md').symlink_to(wiki/'notes/note.md')
    os.mkfifo(wiki/'special.md')
    result = attempt(reader, path, revision(b'# Original\n'), '# Draft\n', mode)
    assert result.status_code in {404, 400}
    assert (wiki/'notes/note.md').read_bytes() == b'# Original\n'


@pytest.mark.parametrize('mode', ['formatted', 'source_recovery'])
@pytest.mark.parametrize('failure', ['marker_missing','marker_directory','marker_unreadable','oversize','unwritable','quota','backup_io','fsync','replace','write'])
def test_both_modes_storage_failures_cannot_publish(reader, wiki, settings, monkeypatch, mode, failure):
    import wiki.saves as saves
    target=wiki/'note.md'; original=b'# Original\n'; target.write_bytes(original)
    identity=wiki/'.backstory-marker'; oldmode=wiki.stat().st_mode
    if failure=='marker_missing': identity.unlink()
    if failure=='marker_directory':
        identity.unlink(); identity.mkdir()
    if failure=='marker_unreadable': identity.chmod(0)
    if failure=='oversize': settings.BACKSTORY_NOTE_MAX_BYTES=4
    if failure=='unwritable':
        assert os.geteuid() != 0
        wiki.chmod(0o555)
    if failure=='quota': settings.BACKSTORY_REVISION_QUOTA_BYTES=1
    if failure=='backup_io':
        from wiki.contracts import StorageError
        def fail(*args): raise StorageError('backup_unavailable',503)
        monkeypatch.setattr(saves,'store_required_backup',fail)
    if failure=='fsync':
        real=os.fsync
        def fail(fd):
            if os.readlink(f'/proc/self/fd/{fd}').split('/')[-1].startswith('.backstory-tmp-'): raise OSError(errno.EIO,'synthetic')
            return real(fd)
        monkeypatch.setattr(os,'fsync',fail)
    if failure=='replace':
        def fail(*args,**kwargs): raise OSError(errno.EIO,'synthetic')
        monkeypatch.setattr(os,'replace',fail)
    if failure=='write':
        real=os.fdopen
        class FailedWriter:
            def __init__(self,stream): self.stream=stream
            def __enter__(self): return self
            def __exit__(self,*args): self.stream.close()
            def write(self,*args): raise OSError(errno.ENOSPC,'synthetic')
        def failed(fd,mode='r',*args,**kwargs):
            stream=real(fd,mode,*args,**kwargs)
            return FailedWriter(stream) if mode=='wb' and '.backstory-tmp-' in os.readlink(f'/proc/self/fd/{fd}') else stream
        monkeypatch.setattr(os,'fdopen',failed)
    try:
        response=attempt(reader,'note.md',revision(original),'# Draft\n',mode)
        assert response.status_code in {413,503}
        assert target.read_bytes()==original
    finally:
        wiki.chmod(oldmode)
        if identity.exists(): identity.chmod(0o600)
    assert not list(wiki.glob('.backstory-tmp-*'))


@pytest.mark.parametrize('route', ['source/','preview/','attachments/','history/'])
@pytest.mark.parametrize('uri', ['%FF.md','bad%ZZ.md','%2e%2e/escape.md'])
def test_malformed_original_uri_denied_on_all_content_routes(reader,wiki,route,uri):
    result=reader.get('/'+route+uri, RAW_URI='/'+route+uri)
    assert result.status_code==404
