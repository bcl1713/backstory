"""Select stable or dev releases from reachable stable tags and commits.

Run in a full Git checkout with fetched tags. Does not mutate Git or publish.
"""
import argparse
import os
from pathlib import Path
import re
import subprocess


def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()


def stable_plan():
    if git('rev-parse', '--is-shallow-repository') == 'true':
        raise SystemExit('Release selection requires full Git history and tags.')
    stable = re.compile(r'v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)')
    tags = []
    for tag in git('tag', '--merged', 'HEAD').splitlines():
        match = stable.fullmatch(tag)
        if match:
            tags.append((tuple(map(int, match.groups())), tag))
    if not tags:
        return {'version': '1.0.0', 'tag': 'v1.0.0', 'previous': ''}
    (major, minor, patch), previous = max(tags)
    if git('rev-parse', f'{previous}^{{commit}}') == git('rev-parse', 'HEAD'):
        return {'version': previous[1:], 'tag': previous, 'previous': previous}
    messages = git('log', '--format=%B%x00', f'{previous}..HEAD').split('\x00')
    breaking = re.compile(r'^\w+(?:\([^\n)]+\))?!: |^BREAKING[ -]CHANGE: ', re.M)
    feature = re.compile(r'^feat(?:\([^\n)]+\))?: ')
    if any(breaking.search(message.strip()) for message in messages):
        version = f'{major + 1}.0.0'
    elif any(feature.match(message.strip()) for message in messages):
        version = f'{major}.{minor + 1}.0'
    else:
        version = f'{major}.{minor}.{patch + 1}'
    return {'version': version, 'tag': f'v{version}', 'previous': previous}


def release_plan(channel='stable'):
    result = stable_plan()
    if channel == 'dev':
        count = git('rev-list', '--count', 'HEAD')
        sha = git('rev-parse', '--short=12', 'HEAD')
        version = f"{result['version']}-dev.{count}.g{sha}"
        result = {**result, 'version': version, 'tag': f'v{version}'}
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--channel', choices=['stable', 'dev'], default='stable')
    result = release_plan(parser.parse_args().channel)
    if (git('tag', '--list', result['tag']) and
            git('rev-parse', f"{result['tag']}^{{commit}}") != git('rev-parse', 'HEAD')):
        raise SystemExit(f"{result['tag']} already exists on a different commit; refusing publication.")
    output = ''.join(f'{key}={value}\n' for key, value in result.items())
    print(output, end='')
    if path := os.environ.get('GITHUB_OUTPUT'):
        with Path(path).open('a') as stream:
            stream.write(output)
