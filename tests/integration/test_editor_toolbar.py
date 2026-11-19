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
def test_menu_save_and_upload_are_persistent_buttons(reader, wiki):
    from html.parser import HTMLParser
    class Toolbar(HTMLParser):
        def __init__(self):
            super().__init__()
            self.inside = False
            self.buttons = []
            self.labels = []
            self.current_button = None
        def handle_starttag(self, tag, attributes):
            attributes = dict(attributes)
            if tag == 'div' and attributes.get('class') == 'persistent-actions':
                self.inside = True
            if tag == 'button' and self.inside:
                self.buttons.append(attributes)
                self.labels.append('')
                self.current_button = len(self.labels) - 1
        def handle_data(self, data):
            if self.current_button is not None:
                self.labels[self.current_button] += data
        def handle_endtag(self, tag):
            if tag == 'button':
                self.current_button = None
            if tag == 'div':
                self.inside = False
    (wiki / 'note.md').write_text('# Note\n')
    response = reader.get('/notes/note.md')
    assert response.status_code == 200
    toolbar = Toolbar()
    toolbar.feed(response.content.decode())
    assert len(toolbar.buttons) == 4
    assert all(button.get('type') == 'button' for button in toolbar.buttons)
    assert [label.strip() for label in toolbar.labels] == ['Menu', 'Save', 'Upload image', 'Upload file']
    assert 'data-zen-toggle' in toolbar.buttons[0]
    assert toolbar.buttons[0]['aria-label'] == 'Navigation and controls'
    assert 'data-save' in toolbar.buttons[1]
    assert 'data-image-upload' in toolbar.buttons[2]
    assert 'data-file-upload' in toolbar.buttons[3]
    assert response.content.count(b'data-image-upload hidden') == 1
    assert response.content.count(b'data-file-upload hidden') == 1
    # Advanced controls stay available through Menu, not deleted.
    assert b'data-format' in response.content
    assert b'data-vim-toggle' in response.content
    assert b'data-source-recovery' in response.content
