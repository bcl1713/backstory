from pathlib import Path
import yaml


def test_rich_rendering_screenshots_use_the_browser_runtime_and_are_uploaded():
    root = Path(__file__).parents[2]
    workflow = yaml.safe_load((root / '.github/workflows/ci.yml').read_text())
    uploads = [step['with'] for step in workflow['jobs']['browser']['steps']
               if str(step.get('uses', '')).startswith('actions/upload-artifact@')]
    rich = next((step for step in uploads if step.get('name', '').startswith('rich-rendering-')), None)
    assert rich is not None, 'rich rendering screenshot artifact missing'
    for kind, file in [('images', 'image-preview.spec.js'), ('math', 'math-preview.spec.js'), ('mermaid', 'diagram-preview.spec.js')]:
        assert f'/tmp/backstory-release-one/browser-runtime/reports/{kind}-*.png' in rich['path']
        assert '${runtime}/reports/' + kind + '-' in (root / 'tests/browser' / file).read_text()
