"""Independent review reproductions; expectations express safety contracts."""
import pytest

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_relocations import actor, service, preview, commit

pytestmark = pytest.mark.django_db


def test_resume_rejects_new_unreviewed_link_source_after_rename(reader, wiki, monkeypatch):
    (wiki / 'From').mkdir()
    (wiki / 'From/Main.md').write_text('# Original\n')
    (wiki / 'Home.md').write_text('[[From/Main]]\n')
    operation = preview(reader, 'From', 'To')
    publish = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *a, **k: (_ for _ in ()).throw(OSError()))
    assert commit(reader, operation)['state'] == 'recovery_required'
    (wiki / 'New.md').write_text('[[From/Main]]\n')
    monkeypatch.setattr(service(), '_publish_change', publish)
    assert commit(reader, operation)['state'] == 'recovery_required'


def test_failed_projection_cannot_bypass_missing_link_identity_check(reader, wiki):
    from wiki.contracts import StorageError
    (wiki / 'old.md').write_text('# Original\n')
    (wiki / 'Home.md').write_text('[[new]]\n' * 60000)
    with pytest.raises(StorageError):
        preview(reader, 'old.md', 'new.md')
