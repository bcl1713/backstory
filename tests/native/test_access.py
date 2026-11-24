"""Native ownership never borrows browser users or crosses journal owners."""
import importlib.util
import pytest
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


def test_local_actor_owns_backup_and_cannot_take_browser_journal(wiki, django_user_model):
    assert importlib.util.find_spec('wiki.actors') is not None, 'native ownership seam is missing'
    from wiki.actors import local_access
    from wiki.models import SavedRevision
    from wiki import removals
    from wiki.saves import save_note
    from wiki.contracts import StorageError
    access = local_access()
    (wiki / 'a.md').write_bytes(b'# A\n')
    from wiki.storage import read_note
    base = read_note('a.md').revision
    assert save_note(access.actor, 'a.md', '# B\n', base).state == 'saved'
    backup = SavedRevision.objects.get()
    assert backup.actor_id is None and backup.local_actor_id == access.actor.pk
    user = django_user_model.objects.create_user(username='synthetic-browser')
    preview = removals.preview_removal(user, 'a.md', 'note', read_note('a.md').revision)
    with pytest.raises(StorageError, match='not_found'):
        removals.get_removal(access.actor, preview['operation_id'])
    native = removals.preview_removal(access.actor, 'a.md', 'note', read_note('a.md').revision)
    with pytest.raises(StorageError, match='not_found'):
        removals.get_removal(user, native['operation_id'])
    assert removals.get_removal(access.actor, native['operation_id'])['state'] == 'preview'
    assert django_user_model.objects.count() == 1  # no native user stand-in


def test_native_interrupted_move_rolls_back_real_rename_and_link_bytes(wiki, monkeypatch):
    """Catches a NULL browser owner being used when backing up inbound changes."""
    from wiki.actors import local_access
    from wiki import relocations
    from wiki.native_service import invoke
    from wiki.models import SavedRevision
    access = local_access()
    (wiki / 'from.md').write_bytes(b'# From\n')
    (wiki / 'ref.md').write_bytes(b'[[from]]\n')
    preview = invoke(access, 'preview_move', {'source': 'from.md', 'destination': 'to.md'}, write=True)
    original = relocations._sync_directories

    def fail_ack(*args, **kwargs):
        raise OSError('synthetic durability acknowledgement loss')
    monkeypatch.setattr(relocations, '_sync_directories', fail_ack)
    outcome = invoke(access, 'commit_move', {'operation_id': preview['operation_id'],
                     'review_token': preview['review_token']}, write=True)
    assert outcome['state'] == 'recovery_required'
    assert not (wiki / 'from.md').exists() and (wiki / 'to.md').read_bytes() == b'# From\n'
    assert (wiki / 'ref.md').read_bytes() == b'[[to]]\n'
    assert SavedRevision.objects.get().local_actor_id == access.actor.pk
    assert invoke(access, 'get_move', {'operation_id': preview['operation_id']})['state'] == 'recovery_required'
    # Inspection did not roll anything forward or back.
    assert (wiki / 'to.md').exists() and (wiki / 'ref.md').read_bytes() == b'[[to]]\n'
    monkeypatch.setattr(relocations, '_sync_directories', original)
    restored = invoke(access, 'rollback_move', {'operation_id': preview['operation_id']}, write=True)
    assert restored['state'] == 'cancelled' and restored['authoritative']
    assert (wiki / 'from.md').read_bytes() == b'# From\n' and not (wiki / 'to.md').exists()
    assert (wiki / 'ref.md').read_bytes() == b'[[from]]\n'


def test_native_lost_save_ack_is_uncertain_and_inspection_does_not_replay(wiki, monkeypatch):
    """Catches exception-to-failure conversion or implicit second invocation."""
    from wiki.actors import local_access
    from wiki import native_service
    from wiki.models import SavedRevision
    from wiki.storage import read_note
    access = local_access()
    (wiki / 'a.md').write_bytes(b'# A\n')
    base = read_note('a.md').revision
    original = native_service._dispatch

    def lose_ack(*args):
        original(*args)
        raise OSError('synthetic response loss after publication')
    with monkeypatch.context() as patch:
        patch.setattr(native_service, '_dispatch', lose_ack)
        outcome = native_service.invoke(access, 'save_note', {'path': 'a.md', 'source': '# B\n', 'revision': base}, write=True)
    assert outcome['state'] == 'uncertain' and outcome['read_before_retry']
    assert SavedRevision.objects.count() == 1
    observed = native_service.invoke(access, 'read_note', {'path': 'a.md'})
    assert observed['source'] == '# B\n' and observed['authoritative']
    assert SavedRevision.objects.count() == 1


def test_operation_lookup_is_bounded_owner_scoped_and_policy_guarded(wiki, settings, django_user_model):
    from wiki.actors import local_access, Access
    from wiki.policy import validate_path
    from wiki import removals
    from wiki.native_service import invoke
    from wiki.storage import read_note
    from wiki.models import RemovalOperation
    access = local_access()
    ids = set()
    for path in ('a.md', 'b.md', 'c.md'):
        (wiki / path).write_bytes(b'# Synthetic\n')
        ids.add(removals.preview_removal(access.actor, path, 'note', read_note(path).revision)['operation_id'])
    other = django_user_model.objects.create_user(username='other-owner')
    browser = Access(other, validate_path)
    hidden_id = removals.preview_removal(other, 'a.md', 'note', read_note('a.md').revision)['operation_id']
    first = invoke(access, 'list_operations', {'kind': 'removal', 'limit': 1})
    assert first['state'] == 'ok' and len(first['items']) == 1 and first['next_cursor']
    found = {first['items'][0]['operation_id']}
    cursor = first['next_cursor']
    while cursor:
        page = invoke(access, 'list_operations', {'kind': 'removal', 'limit': 1, 'cursor': cursor})
        assert page['examined'] <= 1 and len(page['items']) <= 1
        found.update(item['operation_id'] for item in page['items'])
        cursor = page['next_cursor']
    assert found == ids and hidden_id not in found
    assert RemovalOperation.objects.count() == 4  # inspection created no new preview
    rejected = invoke(browser, 'list_operations', {'kind': 'removal', 'limit': 1, 'cursor': first['next_cursor']})
    assert rejected['reason_code'] == 'cursor_invalid' and rejected['restart']
    settings.BACKSTORY_EXCLUSIONS = ['b.md']
    assert invoke(access, 'list_operations', {'kind': 'removal', 'limit': 1, 'cursor': first['next_cursor']})['reason_code'] == 'cursor_invalid'
    items = invoke(access, 'list_operations', {'kind': 'removal', 'limit': 100})['items']
    assert {item['path'] for item in items} == {'a.md', 'c.md'}
    assert all(not {'plan', 'original', 'review_token', 'source_bytes'} & item.keys() for item in items)
    assert invoke(access, 'list_operations', {'kind': 'removal', 'limit': 0})['state'] == 'error'


@pytest.mark.parametrize('replacement', ['root', 'marker'])
def test_local_owner_refuses_journals_after_root_or_marker_replacement(wiki, replacement):
    """Old native journal authority must not transfer to a new storage identity."""
    from wiki.actors import local_access
    from wiki import removals
    from wiki.contracts import StorageError
    from wiki.native_service import invoke
    from wiki.storage import read_note
    access = local_access()
    (wiki / 'a.md').write_bytes(b'# Original storage\n')
    removal = removals.preview_removal(access.actor, 'a.md', 'note', read_note('a.md').revision)
    if replacement == 'root':
        wiki.rename(wiki.with_name('retained-original-root'))
        wiki.mkdir()
        (wiki / '.backstory-marker').touch()
    else:
        (wiki / '.backstory-marker').rename(wiki / '.retained-original-marker')
        (wiki / '.backstory-marker').touch()
    assert invoke(access, 'list_operations', {'kind': 'removal'})['reason_code'] == 'local_storage_context_changed'
    assert invoke(access, 'get_removal', {'operation_id': removal['operation_id']})['reason_code'] == 'local_storage_context_changed'
    with pytest.raises(StorageError, match='local_storage_context_changed'):
        local_access()  # a fresh process cannot silently adopt the changed root
