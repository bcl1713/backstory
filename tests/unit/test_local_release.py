"""No release operation may precede the exact-commit local correctness gate."""
import importlib.util
import json
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]


def module():
    sys.path.insert(0, str(ROOT / 'scripts'))
    spec = importlib.util.spec_from_file_location('local_release', ROOT / 'scripts/local_release.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def test_channel_aliases_never_cross_dev_and_stable():
    m = module()
    assert m.aliases('dev', '1.2.3-dev.1.gabc') == ['ghcr.io/bcl1713/backstory:dev']
    assert m.aliases('stable', '1.2.3') == [
        'ghcr.io/bcl1713/backstory:1.2', 'ghcr.io/bcl1713/backstory:1',
        'ghcr.io/bcl1713/backstory:latest']


def test_publication_rejects_missing_receipt_before_external_commands(tmp_path, monkeypatch):
    m = module()
    calls = []
    monkeypatch.setattr(m, 'command', lambda *args, **kwargs: calls.append(args))
    with pytest.raises(FileNotFoundError):
        m.publish(tmp_path / 'missing.json', 'dev', tmp_path / 'assets')
    assert calls == []


def test_stale_remote_head_blocks_alias_promotion(monkeypatch):
    m = module()
    monkeypatch.setattr(m, 'command', lambda args, **kwargs: 'b' * 40 if args[1] == 'rev-parse' else '')
    with pytest.raises(ValueError, match='advanced'):
        m.assert_remote_head('dev', 'a' * 40)


def test_invalid_digest_is_rejected():
    m = module()
    assert m.validate_digest('sha256:' + 'a' * 64) == 'sha256:' + 'a' * 64
    for value in ['', 'sha256:example', 'repo:latest', 'sha256:' + 'a' * 64 + '\n']:
        with pytest.raises(ValueError):
            m.validate_digest(value)


@pytest.fixture
def release_fixture(tmp_path, monkeypatch):
    m = module()
    root = tmp_path / 'source'
    root.mkdir()
    (root / 'docs').mkdir()
    (root / 'compose.portainer.yaml').write_text('services: {}\n')
    (root / 'portainer.env.example').write_text('BACKSTORY_IMAGE=old\n')
    (root / 'docs/portainer.md').write_text('Deploy 1.0.0\n')
    monkeypatch.setattr(m, 'ROOT', root)
    sha, tree = 'a' * 40, 'b' * 40
    receipt = tmp_path / 'receipt.json'
    from local_ci import build_plan
    receipt.write_text(json.dumps(dict(schema=1, source_sha=sha, source_tree=tree,
                                      gates={s['name']: 'passed' for s in build_plan(tmp_path, 18765)})))
    monkeypatch.setattr(m, 'source_identity', lambda root: (sha, tree))
    commands, builds = [], []
    def command(args, **kwargs):
        commands.append(args)
        if args[:3] == ['git', 'remote', 'get-url']:
            return 'https://github.com/bcl1713/backstory.git'
        if args[:2] == ['git', 'rev-parse']:
            return sha
        if 'scripts/release-version.py' in args:
            return 'version=1.2.3-dev.1.gabc\ntag=v1.2.3-dev.1.gabc\nprevious=v1.2.2'
        return ''
    monkeypatch.setattr(m, 'command', command)
    immutable_files = {name: (root / name).read_text() for name in
                       ['compose.portainer.yaml', 'portainer.env.example', 'docs/portainer.md']}
    def immutable_read(args, **kwargs):
        if args[:2] == ['git', 'show']:
            return immutable_files[args[2].split(':', 1)[1]]
        return b'IMMUTABLE GIT ARCHIVE'
    monkeypatch.setattr(m.subprocess, 'check_output', immutable_read)
    def build(args, **kwargs):
        builds.append((args, kwargs))
        Path(args[args.index('--metadata-file') + 1]).write_text(json.dumps({'containerimage.digest': 'sha256:' + 'c' * 64}))
    monkeypatch.setattr(m.subprocess, 'run', build)
    return m, receipt, tmp_path / 'assets', commands, builds


def test_release_builds_immutable_source_and_keeps_dev_publication_scoped(release_fixture):
    m, receipt, assets, commands, builds = release_fixture
    m.publish(receipt, 'dev', assets)
    assert builds[0][1]['input'] == b'IMMUTABLE GIT ARCHIVE'
    assert builds[0][0][-1] == '-'
    assert '--platform' in builds[0][0]
    assert 'linux/amd64,linux/arm64' in builds[0][0]
    promote = next(args for args in commands if args[:3] == ['docker', 'buildx', 'imagetools'])
    assert promote[-3:] == ['--tag', 'ghcr.io/bcl1713/backstory:dev', 'ghcr.io/bcl1713/backstory@sha256:' + 'c' * 64]
    publish = commands[-1]
    assert publish[:3] == ['gh', 'release', 'edit']
    assert '--prerelease=true' in publish and '--latest=false' in publish
    assert (assets / 'local-ci-receipt.json').exists()
    version = next(args for args in commands if 'scripts/release-version.py' in args)
    assert version[-2:] == ['--source-sha', 'a' * 40]


def test_release_assets_ignore_later_working_tree_edits(release_fixture):
    m, receipt, assets, commands, builds = release_fixture
    (m.ROOT / 'compose.portainer.yaml').write_text('untested mutation')
    m.publish(receipt, 'dev', assets)
    assert (assets / 'compose.portainer.yaml').read_text() == 'services: {}\n'


def test_build_failure_never_moves_aliases_or_creates_release(release_fixture, monkeypatch):
    m, receipt, assets, commands, builds = release_fixture
    def fail(*args, **kwargs):
        raise RuntimeError('build failed')
    monkeypatch.setattr(m.subprocess, 'run', fail)
    with pytest.raises(RuntimeError):
        m.publish(receipt, 'dev', assets)
    assert not any(args[0] == 'docker' or args[:2] == ['gh', 'release'] for args in commands)


def test_github_release_commands_are_pinned_to_public_github(release_fixture):
    m, receipt, assets, commands, builds = release_fixture
    m.publish(receipt, 'dev', assets)
    for args in commands:
        if args[:2] == ['gh', 'api']:
            assert args[args.index('--hostname') + 1] == 'github.com'
        if args[:2] == ['gh', 'release']:
            assert args[args.index('--repo') + 1] == 'github.com/bcl1713/backstory'
