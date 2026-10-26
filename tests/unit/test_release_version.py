"""Release numbers follow real reachable Git history, including failed-run retries."""
import os
from pathlib import Path
import subprocess
import sys

import pytest

SCRIPT = Path(__file__).resolve().parents[2] / 'scripts/release-version.py'


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()


@pytest.fixture
def repo(tmp_path):
    git(tmp_path, 'init', '-b', 'main')
    git(tmp_path, 'config', 'user.name', 'Release Test')
    git(tmp_path, 'config', 'user.email', 'release@example.invalid')
    git(tmp_path, 'commit', '--allow-empty', '-m', 'feat!: initial application')
    return tmp_path


def plan(repo, channel=None):
    output = repo / 'outputs'
    output.unlink(missing_ok=True)
    result = subprocess.run(
        [sys.executable, str(SCRIPT), *(['--channel', channel] if channel else [])],
        cwd=repo, text=True, capture_output=True,
        env={**os.environ, 'GITHUB_OUTPUT': str(output)},
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip()
    return dict(line.split('=', 1) for line in output.read_text().splitlines())


def test_first_release_is_100_even_with_breaking_history(repo):
    assert plan(repo) == {'version': '1.0.0', 'tag': 'v1.0.0', 'previous': ''}


@pytest.mark.parametrize(('message', 'expected'), [
    ('fix: correct saves', '1.2.4'),
    ('docs: update setup', '1.2.4'),
    ('Merge pull request #8', '1.2.4'),
    ('feat: add folders', '1.3.0'),
    ('feat(editor): add headings', '1.3.0'),
    ('feat!: change storage', '2.0.0'),
    ('fix(storage)!: change layout', '2.0.0'),
    ('refactor: change config\n\nBREAKING CHANGE: rename setting', '2.0.0'),
    ('refactor: change config\n\nBREAKING-CHANGE: rename setting', '2.0.0'),
    ('docs: explain feat: and BREAKING CHANGE: syntax', '1.2.4'),
])
def test_next_version_uses_conventional_commits(repo, message, expected):
    git(repo, 'tag', 'v1.2.3')
    git(repo, 'commit', '--allow-empty', '-m', message)
    result = plan(repo)
    assert result == {'version': expected, 'tag': f'v{expected}', 'previous': 'v1.2.3'}


def test_strongest_change_since_release_wins(repo):
    git(repo, 'tag', 'v1.2.3')
    for message in ['feat: add folders', 'fix!: change storage', 'docs: instructions']:
        git(repo, 'commit', '--allow-empty', '-m', message)
    assert plan(repo)['version'] == '2.0.0'


def test_same_commit_retry_keeps_its_version(repo):
    git(repo, 'tag', '-a', 'v1.0.0', '-m', 'Release v1.0.0')
    assert plan(repo)['version'] == '1.0.0'


def test_unreachable_and_nonrelease_tags_do_not_change_version(repo):
    git(repo, 'tag', 'v1.0.0')
    git(repo, 'checkout', '-b', 'other')
    git(repo, 'commit', '--allow-empty', '-m', 'feat!: unrelated work')
    git(repo, 'tag', 'v99.0.0')
    git(repo, 'checkout', 'main')
    git(repo, 'commit', '--allow-empty', '-m', 'fix: main change')
    git(repo, 'tag', 'v100.0.0-rc.1')
    git(repo, 'tag', 'v01.0.0')
    assert plan(repo)['version'] == '1.0.1'


def test_version_order_is_numeric_and_ignores_old_breaking_commits(repo):
    git(repo, 'tag', 'v1.9.0')
    git(repo, 'commit', '--allow-empty', '-m', 'feat!: already released')
    git(repo, 'tag', 'v1.10.0')
    git(repo, 'commit', '--allow-empty', '-m', 'fix: next patch')
    assert plan(repo)['version'] == '1.10.1'


def test_bootstrap_refuses_a_conflicting_unreachable_tag(repo):
    git(repo, 'checkout', '-b', 'other')
    git(repo, 'commit', '--allow-empty', '-m', 'feat: unrelated release')
    git(repo, 'tag', 'v1.0.0')
    git(repo, 'checkout', 'main')
    result = subprocess.run([sys.executable, str(SCRIPT)], cwd=repo,
                            text=True, capture_output=True)
    assert result.returncode != 0
    assert 'already exists on a different commit' in result.stderr


def test_shallow_checkout_cannot_silently_bootstrap(repo, tmp_path_factory):
    git(repo, 'tag', 'v1.0.0')
    git(repo, 'commit', '--allow-empty', '-m', 'fix: next patch')
    clone = tmp_path_factory.mktemp('release-shallow') / 'checkout'
    subprocess.run(['git', 'clone', '--depth', '1', repo.as_uri(), str(clone)],
                   check=True, capture_output=True)
    result = subprocess.run([sys.executable, str(SCRIPT)], cwd=clone,
                            text=True, capture_output=True)
    assert result.returncode != 0
    assert 'full Git history' in result.stderr


def test_dev_bootstrap_is_a_pinned_prerelease(repo):
    sha = git(repo, 'rev-parse', '--short=12', 'HEAD')
    assert plan(repo, 'dev') == {
        'version': f'1.0.0-dev.1.g{sha}',
        'tag': f'v1.0.0-dev.1.g{sha}', 'previous': '',
    }


def test_dev_retry_keeps_version_and_stable_promotion_ignores_prereleases(repo):
    git(repo, 'tag', 'v1.2.3')
    git(repo, 'checkout', '-b', 'dev')
    git(repo, 'commit', '--allow-empty', '-m', 'feat: test before production')
    first = plan(repo, 'dev')
    sha = git(repo, 'rev-parse', '--short=12', 'HEAD')
    assert first['version'] == f'1.3.0-dev.2.g{sha}'
    git(repo, 'tag', first['tag'])
    assert plan(repo, 'dev') == first
    git(repo, 'checkout', 'main')
    git(repo, 'merge', '--no-ff', 'dev', '-m', 'Merge dev into main')
    assert plan(repo)['version'] == '1.3.0'


def test_each_dev_commit_gets_a_distinct_version_without_consuming_stable_versions(repo):
    git(repo, 'tag', 'v1.0.0')
    git(repo, 'commit', '--allow-empty', '-m', 'fix: first test build')
    first = plan(repo, 'dev')
    git(repo, 'tag', first['tag'])
    git(repo, 'commit', '--allow-empty', '-m', 'fix: second test build')
    second = plan(repo, 'dev')
    assert first['version'].startswith('1.0.1-dev.2.')
    assert second['version'].startswith('1.0.1-dev.3.')
    assert plan(repo)['version'] == '1.0.1'


def test_unsupported_release_channel_is_rejected(repo):
    result = subprocess.run([sys.executable, str(SCRIPT), '--channel', 'feature'],
                            cwd=repo, text=True, capture_output=True)
    assert result.returncode != 0
