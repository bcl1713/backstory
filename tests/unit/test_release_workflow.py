"""Exercise release shell orchestration with a controlled external GitHub CLI."""
import os
from pathlib import Path
import subprocess

import yaml

WORKFLOW = Path(__file__).resolve().parents[2] / '.github/workflows/release.yml'


def run_step(tmp_path, name, *, api_status=0, state='draft'):
    steps = yaml.safe_load(WORKFLOW.read_text())['jobs']['publish']['steps']
    script = next(step['run'] for step in steps if step.get('name') == name)
    script = script.replace('${{ github.repository }}', 'example/backstory')
    bin_dir = tmp_path / 'bin'
    bin_dir.mkdir()
    gh = bin_dir / 'gh'
    gh.write_text('''#!/bin/bash
set -eu
case "$1 $2" in
  'api --paginate') printf '%s' "$TEST_RELEASE_STATE"; exit "$TEST_API_STATUS" ;;
  'release view') exit "$TEST_API_STATUS" ;;
  'release create') exit 42 ;;
  'release upload') exit 0 ;;
  'release edit')
    shift 2
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --target) shift; printf '%s' "$1" > target ;;
        --notes-file) shift; cp "$1" notes ;;
        --draft=false) cp target published-target; cp notes published-notes ;;
      esac
      shift
    done ;;
  *) exit 43 ;;
esac
''')
    gh.chmod(0o700)
    assets = tmp_path / 'release-assets'
    assets.mkdir()
    (assets / 'release-notes.md').write_text('current image digest')
    (tmp_path / 'target').write_text('old-source')
    (tmp_path / 'notes').write_text('old image digest')
    result = subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', script],
                            cwd=tmp_path, capture_output=True, text=True, env={
        **os.environ, 'PATH': f'{bin_dir}:{os.environ["PATH"]}',
        'TAG': 'v1.0.0', 'SOURCE_SHA': 'current-source', 'PREVIOUS': '',
        'GITHUB_REPOSITORY': 'example/backstory',
        'GITHUB_OUTPUT': str(tmp_path / 'outputs'),
        'GITHUB_STEP_SUMMARY': str(tmp_path / 'summary'),
        'TEST_API_STATUS': str(api_status), 'TEST_RELEASE_STATE': state,
    })
    return result


def test_draft_retry_publishes_current_source_and_image_notes(tmp_path):
    result = run_step(tmp_path, 'Create matching GitHub release after image publication')
    assert result.returncode == 0, result.stderr
    assert (tmp_path / 'published-target').read_text() == 'current-source'
    assert (tmp_path / 'published-notes').read_text() == 'current image digest'


def test_release_lookup_outage_stops_before_publication(tmp_path):
    result = run_step(tmp_path, 'Check for an already published release', api_status=1)
    assert result.returncode != 0


def test_publication_refuses_a_release_published_during_the_build(tmp_path):
    result = run_step(tmp_path, 'Create matching GitHub release after image publication', state='published')
    assert result.returncode != 0
    assert not (tmp_path / 'published-target').exists()
