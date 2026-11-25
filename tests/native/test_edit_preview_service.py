"""Read-only shared service and mapped managed-date acceptance, no SDK dependency."""
from datetime import datetime, timezone

import pytest
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


def need(value, code):
    if not value:
        raise AssertionError(code)


def account():
    from wiki.models import SavedRevision, FormatRecovery
    from indexing.models import IndexJob, ScanState
    return [list(model.objects.order_by('pk').values()) for model in (SavedRevision, FormatRecovery, IndexJob, ScanState)]


@pytest.mark.parametrize('before', [True, False])
def test_preview_scalar_length_mapping_then_real_save(wiki, settings, monkeypatch, before):
    from wiki import saves
    from wiki.actors import local_access
    from wiki.native_service import invoke
    from wiki.storage import read_note
    from indexing.models import IndexJob
    settings.BACKSTORY_WIKI_TIMEZONE = 'UTC'
    today = datetime.now(timezone.utc).date().isoformat()
    fields = 'modified: "old" # retained\ndescription: before\n' if before else 'description: before\nmodified: "old" # retained\n'
    source = '---\n' + fields + '---\n\n# Stable\n'
    raw = source.encode()
    (wiki / 'n.md').write_bytes(raw)
    access = local_access()
    revision = read_note('n.md').revision
    args = {'path': 'n.md', 'revision': revision, 'old_text': 'description: before', 'new_text': 'description: after'}
    rows = account()
    stat = (wiki / 'n.md').stat()

    def forbidden(*args, **kwargs):
        raise AssertionError('preview_entered_mutation_stage')

    with monkeypatch.context() as guard:
        guard.setattr(saves, 'enqueue_note', forbidden)
        guard.setattr(saves, 'store_required_backup', forbidden)
        guard.setattr(saves, 'register_stage', forbidden)
        result = invoke(access, 'preview_edit_note', args)
    need(result['state'] == 'preview' and result['new_text'] == args['new_text'], 'mapped_preview')
    need((wiki / 'n.md').read_bytes() == raw and (wiki / 'n.md').stat().st_mtime_ns == stat.st_mtime_ns
         and account() == rows and not list(wiki.glob('.backstory-tmp-*')), 'no_mutation_stage_or_queue')
    saved = invoke(access, 'edit_note', {**args, 'new_text': result['new_text']}, write=True)
    expected = source.replace('description: before', 'description: after').replace('"old"', '"' + today + '"').encode()
    need(saved['authoritative'] and (wiki / 'n.md').read_bytes() == expected and
         IndexJob.objects.get(path='n.md').revision == saved['revision'], 'real_save_accepts_mapped_literal')


@pytest.mark.parametrize('fault', ['config', 'revision'])
def test_preview_final_revalidation(wiki, monkeypatch, fault):
    from wiki import edit_preview
    from wiki.actors import local_access
    from wiki.native_service import invoke
    from wiki.storage import read_note
    source = b'# Stable\n\nalpha\n'
    (wiki / 'n.md').write_bytes(source)
    access = local_access()
    revision = read_note('n.md').revision
    original = edit_preview._prepare_formatted
    changed = []

    def intervene(*args):
        result = original(*args)
        if not changed:
            changed.append(True)
            if fault == 'config':
                (wiki / '.prettierrc.json').write_text('{"proseWrap":"preserve"}')
            else:
                (wiki / 'n.md').write_bytes(b'# External\n')
        return result

    monkeypatch.setattr(edit_preview, '_prepare_formatted', intervene)
    rows = account()
    result = invoke(access, 'preview_edit_note', {'path': 'n.md', 'revision': revision, 'old_text': 'alpha', 'new_text': 'bravo'})
    need(result['reason_code'] == ('edit_config_changed' if fault == 'config' else 'revision_conflict'), 'actual_final_recheck')
    need(account() == rows and (wiki / 'n.md').read_bytes() == (source if fault == 'config' else b'# External\n'), 'no_preview_mutation')


def test_preview_access_and_utf8_input_boundary(wiki, settings, monkeypatch):
    from wiki.actors import local_access, Access
    from wiki.native_service import invoke
    from wiki.storage import read_note
    from django.core.exceptions import PermissionDenied
    (wiki / 'n.md').write_bytes(b'# Stable\n\nalpha\n')
    access = local_access()
    args = {'path': 'n.md', 'revision': read_note('n.md').revision, 'old_text': 'alpha', 'new_text': 'bravo'}
    rows = account()
    def deny(*args):
        raise PermissionDenied
    result = invoke(Access(access.actor, deny), 'preview_edit_note', args)
    need(result['reason_code'] == 'access_denied' and account() == rows, 'access_seam')
    result = invoke(access, 'preview_edit_note', {**args, 'new_text': 'é' * 2049})
    need(result['reason_code'] == 'invalid_arguments' and account() == rows, 'utf8_byte_bound')
    from wiki.models import LocalActor
    LocalActor.objects.filter(pk=access.actor.pk).update(enabled=False)
    result = invoke(access, 'preview_edit_note', args)
    need(result['reason_code'] == 'access_denied' and account() == rows, 'revoked_server_actor')


def test_preview_counts_encoding_bom_in_final_note_limit(wiki, settings):
    from wiki.actors import local_access
    from wiki.native_service import invoke
    from wiki.storage import read_note
    raw = b'\xef\xbb\xbf# Stable\n\nalpha\n'
    (wiki / 'n.md').write_bytes(raw)
    settings.BACKSTORY_NOTE_MAX_BYTES = len(raw)
    access = local_access()
    revision = read_note('n.md').revision
    rows = account()
    result = invoke(access, 'preview_edit_note', {'path': 'n.md', 'revision': revision,
                    'old_text': 'alpha', 'new_text': 'bravooo'})
    need(result['reason_code'] == 'note_too_large' and 'new_text' not in result, 'bom_limit_not_false_preview')
    need((wiki / 'n.md').read_bytes() == raw and account() == rows, 'bom_limit_readonly')
