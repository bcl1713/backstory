#!/usr/bin/env python3
"""Publish an already-tested commit locally. Never deploys or creates credentials.

Needs preconfigured GitHub CLI and GHCR Docker authentication plus a local
multi-platform buildx builder. Publication is explicit via --publish.
"""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

from local_ci import ROOT, source_identity, validate_receipt

REPOSITORY = 'bcl1713/backstory'
IMAGE = 'ghcr.io/' + REPOSITORY


def command(args, **kwargs):
    return subprocess.check_output(args, cwd=ROOT, text=True, **kwargs).strip()


def aliases(channel, version):
    if channel == 'dev':
        return [IMAGE + ':dev']
    return [IMAGE + ':' + version.rsplit('.', 1)[0], IMAGE + ':' + version.split('.')[0], IMAGE + ':latest']


def validate_digest(value):
    if not isinstance(value, str) or not re.fullmatch(r'sha256:[0-9a-f]{64}', value):
        raise ValueError('Build did not report a valid immutable image digest.')
    return value


def assert_remote_head(branch, sha):
    command(['git', 'fetch', 'origin', branch])
    if command(['git', 'rev-parse', 'origin/' + branch]) != sha:
        raise ValueError(branch + ' advanced; refusing stale publication or channel aliases.')


def release_state(tag):
    state = command(['gh', 'api', '--hostname', 'github.com', '--paginate', 'repos/' + REPOSITORY + '/releases?per_page=100',
                     '--jq', '.[] | select(.tag_name == env.TAG) | if .draft then "draft" else "published" end'],
                    env={**os.environ, 'TAG': tag})
    if state not in ('', 'draft', 'published'):
        raise ValueError('Unexpected release lookup result; refusing publication.')
    return state


def existing_image(version, tag, sha):
    """Resume a partial release only when both immutable tags agree."""
    digests = []
    for name in (version, tag):
        reference = IMAGE + ':' + name
        try:
            output = command(['docker', 'buildx', 'imagetools', 'inspect', reference,
                              '--format', '{{json .}}'], stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as error:
            # Auth, transport and other registry errors must never mean absent.
            if (error.stderr or '').strip() != 'ERROR: ' + reference + ': not found':
                raise
            digests.append(None)
            continue
        data = json.loads(output)
        digest = validate_digest(data.get('manifest', {}).get('digest'))
        images = data.get('image', {})
        if set(images) != {'linux/amd64', 'linux/arm64'}:
            raise ValueError('Existing version image must contain both release platforms.')
        expected = {'org.opencontainers.image.source': 'https://github.com/' + REPOSITORY,
                    'org.opencontainers.image.revision': sha,
                    'org.opencontainers.image.version': version}
        for image in images.values():
            labels = image.get('config', {}).get('Labels', {})
            if any(labels.get(key) != value for key, value in expected.items()):
                raise ValueError('Existing version image does not match the tested source/version.')
        digests.append(digest)
    if digests[0] != digests[1]:
        raise ValueError('Version image tags are incomplete or disagree; inspect and recover without overwriting them.')
    return digests[0]


def write_assets(directory, version, tag, digest, sha, channel):
    def tested_file(path):
        return subprocess.check_output(['git', 'show', sha + ':' + path], cwd=ROOT, text=True)
    files = {
        'compose.portainer.yaml': tested_file('compose.portainer.yaml'),
        'portainer.env.example': re.sub(r'^BACKSTORY_IMAGE=.*$', 'BACKSTORY_IMAGE=' + IMAGE + ':' + version,
                                       tested_file('portainer.env.example'), flags=re.M),
        'portainer.md': tested_file('docs/portainer.md').replace('1.0.0', version),
    }
    for name, content in files.items():
        (directory / name).write_text(content)
    (directory / 'SHA256SUMS').write_text(''.join(
        hashlib.sha256((directory / name).read_bytes()).hexdigest() + '  ' + name + '\n'
        for name in files))
    (directory / 'release-notes.md').write_text(
        f'Deploy Backstory with the attached Portainer or Compose assets.\n\n'
        f'Image: `{IMAGE}:{version}` (linux/amd64 and linux/arm64)\n\n'
        f'Digest: `{IMAGE}@{digest}`\n\nTested source: `{sha}`\n\n'
        f'Release channel: `{channel}`. The full correctness suite ran locally. '
        'Publication does not redeploy a server.\n\n'
        f'[Deployment guide](https://github.com/{REPOSITORY}/blob/{tag}/docs/portainer.md). '
        'Set storage paths, UID/GID, public host, CSRF origin and trusted proxy peer. '
        'Create named accounts interactively after startup.\n')


def publish(receipt_path, channel, assets):
    receipt = json.loads(Path(receipt_path).read_text())
    sha, tree = source_identity(ROOT)
    validate_receipt(receipt, sha, tree)
    branch = 'dev' if channel == 'dev' else 'main'
    origin = command(['git', 'remote', 'get-url', 'origin'])
    if origin not in ('https://github.com/' + REPOSITORY + '.git',
                       'https://github.com/' + REPOSITORY,
                       'git@github.com:' + REPOSITORY + '.git'):
        raise ValueError('Origin is not the expected Backstory repository.')
    command(['git', 'fetch', 'origin', branch, '--tags'])
    assert_remote_head(branch, sha)
    outputs = command([sys.executable, 'scripts/release-version.py', '--channel', channel, '--source-sha', sha])
    version_data = dict(line.split('=', 1) for line in outputs.splitlines() if '=' in line)
    version, tag = version_data['version'], version_data['tag']
    if release_state(tag) == 'published':
        print('Release already published: ' + tag)
        return
    digest = existing_image(version, tag, sha)
    assets = Path(assets).resolve()
    if assets == ROOT or ROOT in assets.parents:
        raise ValueError('Release assets must be outside the source checkout.')
    assets.mkdir(mode=0o700, parents=False, exist_ok=False)
    metadata = assets / 'build-metadata.json'
    # A tar from the validated commit excludes untracked files and concurrent edits.
    context = subprocess.check_output(['git', 'archive', '--format=tar', sha], cwd=ROOT)
    build = ['docker', 'buildx', 'build', '--platform', 'linux/amd64,linux/arm64', '--push',
             '--metadata-file', str(metadata), '--build-arg', 'BACKSTORY_VERSION=' + version,
             '--build-arg', 'BACKSTORY_REVISION=' + sha,
             '--label', 'org.opencontainers.image.source=https://github.com/' + REPOSITORY,
             '--label', 'org.opencontainers.image.revision=' + sha,
             '--label', 'org.opencontainers.image.version=' + version,
             '--tag', IMAGE + ':' + version, '--tag', IMAGE + ':' + tag, '-']
    if digest is None:
        subprocess.run(build, cwd=ROOT, input=context, check=True)
        digest = validate_digest(json.loads(metadata.read_text()).get('containerimage.digest'))
    else:
        metadata.write_text(json.dumps({'containerimage.digest': digest, 'reused': True}, indent=2) + '\n')
    # Do not overwrite aliases if a newer release/source arrived during the build.
    assert_remote_head(branch, sha)
    if source_identity(ROOT) != (sha, tree):
        raise ValueError('Checkout changed during publication; aliases and release refused.')
    if release_state(tag) == 'published':
        raise ValueError('Release became public during build; refusing to modify it.')
    promote = ['docker', 'buildx', 'imagetools', 'create']
    for alias in aliases(channel, version):
        promote += ['--tag', alias]
    command(promote + [IMAGE + '@' + digest])
    write_assets(assets, version, tag, digest, sha, channel)
    state = release_state(tag)
    if state == 'published':
        raise ValueError('Release became public before upload; refusing to modify it.')
    common = ['--repo', 'github.com/' + REPOSITORY]
    if state == '':
        create = ['gh', 'release', 'create', tag, *common, '--target', sha,
                  '--title', 'Backstory ' + tag, '--draft', '--generate-notes',
                  '--notes-file', str(assets / 'release-notes.md')]
        if version_data['previous'] and version_data['previous'] != tag:
            create += ['--notes-start-tag', version_data['previous']]
        command(create)
    else:
        command(['gh', 'release', 'edit', tag, *common, '--target', sha,
                 '--notes-file', str(assets / 'release-notes.md')])
    command(['gh', 'release', 'upload', tag, *common, *[str(assets / name) for name in
             ('compose.portainer.yaml', 'portainer.env.example', 'portainer.md', 'SHA256SUMS')], '--clobber'])
    command(['gh', 'release', 'edit', tag, *common, '--draft=false',
             '--prerelease=' + str(channel == 'dev').lower(), '--latest=' + str(channel == 'stable').lower()])
    (assets / 'local-ci-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('Published https://github.com/' + REPOSITORY + '/releases/tag/' + tag)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt', type=Path, required=True)
    parser.add_argument('--channel', choices=['dev', 'stable'], required=True)
    parser.add_argument('--assets', type=Path, required=True, help='New directory outside checkout.')
    parser.add_argument('--publish', action='store_true', help='Actually upload image and publish release.')
    args = parser.parse_args()
    if not args.publish:
        parser.error('Publication is explicit: review the runbook and pass --publish when authorized.')
    common_dir = Path(command(['git', 'rev-parse', '--git-common-dir']))
    if not common_dir.is_absolute():
        common_dir = ROOT / common_dir
    with (common_dir / ('local-release-' + args.channel + '.lock')).open('w') as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        publish(args.receipt, args.channel, args.assets)


if __name__ == '__main__':
    main()
