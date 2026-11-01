from html.parser import HTMLParser
import json
import pytest
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

FENCE = '```mermaid\nflowchart LR\nA[Start] --> B{Ready?}\n```'
class Tags(HTMLParser):
    def __init__(self): super().__init__(); self.attrs=[]
    def handle_starttag(self, tag, attrs): self.attrs.append((tag,dict(attrs)))

def test_preview_mermaid_fences_have_only_escaped_inert_bounded_placeholders():
    from wiki.markdown import render_preview
    source=FENCE+'\n\n```mermaid\nA[<img src=/private-canary>]\n```\n\n<div data-mermaid-source="private-canary">raw</div>'
    result=render_preview(source,'note.md');tags=Tags();tags.feed(result.html)
    placeholders=[attrs for tag,attrs in tags.attrs if 'data-mermaid-source' in attrs]
    assert len(placeholders)==2
    assert placeholders[0]['data-mermaid-source']=='flowchart LR\nA[Start] --> B{Ready?}\n'
    assert not any(tag in {'iframe','svg','script','img','div'} for tag,_ in tags.attrs)
    assert '&lt;img' in result.html and '&lt;div' in result.html
    limited=render_preview((FENCE+'\n\n')*40,'note.md');assert limited.html.count('data-mermaid-source=')==32
    assert 'preview_mermaid_limit' in limited.diagnostics

@pytest.mark.django_db
def test_note_and_preview_flag_request_specific_enabled_state_without_policy_changes(reader,wiki,settings):
    (wiki/'diagram.md').write_text(FENCE)
    for value,expected in [('',b'data-mermaid-enabled="false"'),('http://testserver:8765',b'data-mermaid-enabled="false"'),('http://testserver',b'data-mermaid-enabled="false"')]:
        settings.BACKSTORY_MERMAID_PARENT_ORIGIN=value
        assert expected in reader.get('/notes/diagram.md').content
        assert b'src="/static/diagram-preview-page.js"' not in reader.get('/preview/diagram.md').content
    settings.BACKSTORY_MERMAID_PARENT_ORIGIN='http://127.0.0.1:8765'
    for path in ['/notes/diagram.md','/preview/diagram.md']:
        response=reader.get(path,HTTP_HOST='127.0.0.1:8765');assert b'data-mermaid-enabled="true"' in response.content
        if path.startswith('/preview/'):
            assert b'src="/static/diagram-preview-page.js"' in response.content
        assert response['X-Frame-Options']=='DENY' and "frame-ancestors 'none'" in response['Content-Security-Policy']
    draft=reader.post('/preview/diagram.md',data=json.dumps({'source':FENCE}),content_type='application/json')
    assert 'data-mermaid-source' in draft.json()['html']
    assert (wiki/'diagram.md').read_text()==FENCE

def test_preview_complete_fence_scope_agrees_with_editor_and_does_not_forge_markers():
    from wiki.markdown import render_preview
    for source in ['```mermaid\nflowchart TD\nA-->B\n```  ', '~~~mermaid\nflowchart TD\nA-->B\n~~~']:
        assert 'data-mermaid-source' in render_preview(source,'note.md').html
    for source in ['```mermaid\nflowchart TD\nA-->B', '> ```mermaid\n> flowchart TD\n> A-->B\n> ```', '  ```mermaid\nflowchart TD\nA-->B\n```', '```mermaid extra\nflowchart TD\nA-->B\n```', '<pre data-mermaid-source="flowchart TD">raw</pre>']:
        tags=Tags();tags.feed(render_preview(source,'note.md').html)
        assert not any('data-mermaid-source' in attrs for _,attrs in tags.attrs),source

def test_preview_fence_transport_budget_matches_javascript_utf16_and_full_fence_bounds():
    from wiki.markdown import render_preview
    for source in ['```mermaid\n'+'𐐀'*4097+'\n```', '`'*5000+'mermaid\nflowchart TD\nA-->B\n'+'`'*5000]:
        result=render_preview(source,'note.md')
        assert 'data-mermaid-source' not in result.html
        assert 'preview_mermaid_limit' in result.diagnostics

def test_unicode_line_separator_in_prose_does_not_change_fence_source_line_mapping():
    from wiki.markdown import render_preview
    assert 'data-mermaid-source' in render_preview('Before\u2028still same Markdown line\n\n'+FENCE,'note.md').html
