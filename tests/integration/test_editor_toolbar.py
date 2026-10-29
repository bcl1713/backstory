"""The compact toolbar does not duplicate the editor's link shortcuts."""
import pytest
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki


@pytest.mark.django_db
def test_note_toolbar_has_no_link_button_but_keeps_completion_help(reader, wiki):
    (wiki / 'note.md').write_text('# Note\n')
    response = reader.get('/notes/note.md')
    assert response.status_code == 200
    assert b'data-complete-link' not in response.content
    assert b'Type [[' in response.content
    assert b'Ctrl/' in response.content and b'Space' in response.content
    assert b'data-link-completion-status' in response.content


@pytest.mark.django_db
def test_only_menu_and_save_are_persistent_buttons(reader, wiki):
    from html.parser import HTMLParser
    class Toolbar(HTMLParser):
        def __init__(self):
            super().__init__()
            self.inside = False
            self.buttons = []
        def handle_starttag(self, tag, attributes):
            attributes = dict(attributes)
            if tag == 'div' and attributes.get('class') == 'persistent-actions':
                self.inside = True
            if tag == 'button' and self.inside:
                self.buttons.append(attributes)
        def handle_endtag(self, tag):
            if tag == 'div':
                self.inside = False
    (wiki / 'note.md').write_text('# Note\n')
    response = reader.get('/notes/note.md')
    toolbar = Toolbar()
    toolbar.feed(response.content.decode())
    assert len(toolbar.buttons) == 2
    assert 'data-zen-toggle' in toolbar.buttons[0]
    assert 'data-save' in toolbar.buttons[1]
    # Advanced controls stay available through Menu, not deleted.
    assert b'data-format' in response.content
    assert b'data-vim-toggle' in response.content
    assert b'data-source-recovery' in response.content
