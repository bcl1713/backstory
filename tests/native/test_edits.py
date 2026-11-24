"""Targeted compact outcomes exercise real save publication with bounded faults."""
from types import SimpleNamespace

import pytest
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.mark.parametrize('fault', ['enqueue', 'readback', 'config', 'revision', 'durability'])
def test_targeted_edit_outcomes_never_echo_or_replay(wiki, monkeypatch, fault):
    from wiki import saves, tool_results
    from wiki.actors import local_access
    from wiki.contracts import StorageError
    from wiki.models import SavedRevision, FormatRecovery
    from wiki.native_service import invoke
    from wiki.storage import read_note

    access = local_access()
    before = b'# Stable\n\nalpha\n'
    (wiki / 'n.md').write_bytes(before)
    revision = read_note('n.md').revision
    replace = saves.os.replace
    publications = []

    def publish(*args, **kwargs):
        publications.append(True)
        replace(*args, **kwargs)
        if fault == 'durability':
            raise OSError('synthetic lost acknowledgement')

    monkeypatch.setattr(saves.os, 'replace', publish)
    if fault == 'enqueue':
        def fail_enqueue(*args):
            raise OSError('synthetic enqueue failure')
        monkeypatch.setattr(saves, 'enqueue_note', fail_enqueue)
    elif fault == 'readback':
        def fail_readback(*args):
            raise StorageError('storage_io_error', 503)
        monkeypatch.setattr(tool_results, 'read_note', fail_readback)
    elif fault == 'config':
        monkeypatch.setattr(saves, 'snapshot_config', lambda path: SimpleNamespace(digest='changed'))
    elif fault == 'revision':
        original = saves.format_source
        def external_change(*args):
            result = original(*args)
            (wiki / 'n.md').write_bytes(b'# External\n')
            return result
        monkeypatch.setattr(saves, 'format_source', external_change)

    result = invoke(access, 'edit_note', {'path': 'n.md', 'revision': revision,
                    'old_text': 'alpha', 'new_text': 'bravo'}, write=True)
    assert not {'source', 'diff', 'diagnostics', 'recovery_token', 'old_text', 'new_text'} & result.keys()
    assert FormatRecovery.objects.count() == 0
    if fault in {'config', 'revision'}:
        assert result['reason_code'] == ('edit_config_changed' if fault == 'config' else 'revision_conflict')
        assert publications == [] and SavedRevision.objects.count() == 0
        assert (wiki / 'n.md').read_bytes() == (before if fault == 'config' else b'# External\n')
    else:
        assert len(publications) == 1 and SavedRevision.objects.count() == 1
        assert (wiki / 'n.md').read_bytes() == before.replace(b'alpha', b'bravo')
        if fault == 'enqueue':
            assert result['state'] == 'saved_index_delayed' and result['authoritative']
            assert result['indexing']['state'] == 'delayed'
        elif fault == 'readback':
            assert result['state'] == 'uncertain' and not result['authoritative']
            assert result['read_before_retry'] and result['inspect_before_retry']
        else:
            assert result['state'] == 'saved' and result['authoritative']
            assert result['durability_confirmed'] is False and result['read_before_retry']
