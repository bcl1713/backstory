"""No release operation may precede the exact-commit local correctness gate."""
import importlib.util
import json
from pathlib import Path
import sys
import subprocess

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
        if args[:3] == ['docker', 'buildx', 'imagetools'] and args[3] == 'inspect':
            raise subprocess.CalledProcessError(1, args, stderr='ERROR: ' + args[4] + ': not found\n')
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
    promote = next(args for args in commands if args[:4] == ['docker', 'buildx', 'imagetools', 'create'])
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
    assert not any(args[:4] == ['docker', 'buildx', 'imagetools', 'create'] or args[:2] == ['gh', 'release'] for args in commands)


def test_github_release_commands_are_pinned_to_public_github(release_fixture):
    m, receipt, assets, commands, builds = release_fixture
    m.publish(receipt, 'dev', assets)
    for args in commands:
        if args[:2] == ['gh', 'api']:
            assert args[args.index('--hostname') + 1] == 'github.com'
        if args[:2] == ['gh', 'release']:
            assert args[args.index('--repo') + 1] == 'github.com/bcl1713/backstory'


def registry_metadata(digest='c', revision='a' * 40):
    return json.dumps({
        'manifest': {'digest': 'sha256:' + digest * 64},
        'image': {platform: {'os': 'linux', 'architecture': platform.split('/')[1],
                            'config': {'Labels': {
                                'org.opencontainers.image.source': 'https://github.com/bcl1713/backstory',
                                'org.opencontainers.image.revision': revision,
                                'org.opencontainers.image.version': '1.2.3-dev.1.gabc'}}}
                  for platform in ('linux/amd64', 'linux/arm64')},
    })


def test_retry_after_github_failure_reuses_pushed_digest_without_rebuilding(release_fixture, monkeypatch):
    m, receipt, assets, commands, builds = release_fixture
    original = m.command
    pushed = False
    def command(args, **kwargs):
        if args[:4] == ['docker', 'buildx', 'imagetools', 'inspect'] and pushed:
            return registry_metadata()
        if args[:3] == ['gh', 'release', 'create'] and not pushed:
            raise RuntimeError('GitHub unavailable after image push')
        return original(args, **kwargs)
    monkeypatch.setattr(m, 'command', command)
    with pytest.raises(RuntimeError, match='GitHub unavailable'):
        m.publish(receipt, 'dev', assets)
    assert len(builds) == 1
    pushed = True
    recovered = assets.with_name('recovered')
    m.publish(receipt, 'dev', recovered)
    assert len(builds) == 1
    assert 'sha256:' + 'c' * 64 in (recovered / 'release-notes.md').read_text()


@pytest.mark.parametrize('problem', ['different-digests', 'wrong-source', 'missing-platform', 'partial-tags', 'registry-error'])
def test_existing_image_conflicts_or_lookup_errors_block_all_publication(release_fixture, monkeypatch, problem):
    m, receipt, assets, commands, builds = release_fixture
    original = m.command
    def command(args, **kwargs):
        if args[:4] == ['docker', 'buildx', 'imagetools', 'inspect']:
            if problem == 'registry-error':
                raise subprocess.CalledProcessError(1, args, stderr='ERROR: registry unavailable')
            if problem == 'partial-tags' and args[4].endswith(':v1.2.3-dev.1.gabc'):
                return original(args, **kwargs)
            data = json.loads(registry_metadata(
                digest='d' if problem == 'different-digests' and args[4].endswith(':v1.2.3-dev.1.gabc') else 'c',
                revision='b' * 40 if problem == 'wrong-source' else 'a' * 40))
            if problem == 'missing-platform':
                del data['image']['linux/arm64']
            return json.dumps(data)
        return original(args, **kwargs)
    monkeypatch.setattr(m, 'command', command)
    with pytest.raises((ValueError, subprocess.CalledProcessError)):
        m.publish(receipt, 'dev', assets)
    assert builds == []
    assert not any(args[:4] == ['docker', 'buildx', 'imagetools', 'create'] or args[:2] == ['gh', 'release'] for args in commands)


def test_image_internal_identity_uses_the_exact_tested_commit(release_fixture):
    m, receipt, assets, commands, builds = release_fixture
    m.publish(receipt, 'dev', assets)
    command = builds[0][0]
    assert 'BACKSTORY_REVISION=' + 'a' * 40 in command
    assert 'BACKSTORY_VERSION=1.2.3-dev.1.gabc' in command
