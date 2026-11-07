"""Artifact-local identity must fail closed without trusting runtime selectors."""
import json
from pathlib import Path
import shutil
import subprocess
import sys

import pytest


@pytest.fixture
def metadata(tmp_path, monkeypatch):
    import wiki.build_identity as identity
    path = tmp_path / '_build_identity.json'
    monkeypatch.setattr(identity, '_METADATA_PATH', path)
    return path


@pytest.mark.parametrize('version', ['1.4.0', '1.4.0-dev.12.g0123456789ab'])
def test_valid_metadata_returns_only_public_identity(metadata, version):
    from wiki.build_identity import application_identity
    metadata.write_text(json.dumps({'build': '0123456789abcdef' * 2 + '01234567',
                                    'version': version, 'name': 'private-name',
                                    'token': 'secret', 'path': '/private/wiki'}))
    assert application_identity() == {
        'name': 'Backstory', 'build': '0123456789abcdef' * 2 + '01234567',
        'version': version,
    }


@pytest.mark.parametrize('raw', [
    None, b'', b'{', b'[]', b'null', b'"private"', b'42', b'true', b'\xff',
    b'{"build":"' + b'a' * 40 + b'","version":"1.4.0","extra":"' + b'x' * 1024 + b'"}',
    b'[' * 1000,
])
def test_missing_malformed_or_oversized_metadata_is_unknown(metadata, raw):
    from wiki.build_identity import application_identity
    if raw is not None:
        metadata.write_bytes(raw)
    assert application_identity() == {
        'name': 'Backstory', 'build': 'unknown', 'version': 'unknown',
    }


def test_unreadable_metadata_is_unknown(metadata):
    from wiki.build_identity import application_identity
    metadata.mkdir()  # A real open failure, independent of root/permission bypass.
    assert application_identity() == {
        'name': 'Backstory', 'build': 'unknown', 'version': 'unknown',
    }


@pytest.mark.parametrize(('build', 'version', 'want_build', 'want_version'), [
    ('a' * 40, '1.4.0', 'a' * 40, '1.4.0'),
    ('a' * 40, None, 'a' * 40, 'unknown'),
    (None, '1.4.0', 'unknown', '1.4.0'),
    (None, None, 'unknown', 'unknown'),
    *[(bad, '1.4.0', 'unknown', '1.4.0') for bad in
      ('a' * 39, 'a' * 41, 'A' * 40, 'g' * 40, 'a' * 40 + '\n', '',
       'dev', 'secret/path', 123, True, [], {})],
    *[('a' * 40, bad, 'a' * 40, 'unknown') for bad in
      ('', 'latest', 'dev', 'v1.4.0', '1.4', '1.4.0\n', '01.4.0', '1.04.0',
       '1.4.00', '1.4.0-dev.01.g0123456789ab', '1.4.0-dev.1.gABCDEF012345',
       '1.4.0-dev.1.gabcdef', '１.４.０', '1' * 81 + '.4.0',
       'secret/path', 123, True, [], {})],
])
def test_fields_are_independently_validated(metadata, build, version, want_build, want_version):
    from wiki.build_identity import application_identity
    content = {key: value for key, value in {'build': build, 'version': version}.items()
               if value is not None}
    metadata.write_text(json.dumps(content))
    assert application_identity() == {
        'name': 'Backstory', 'build': want_build, 'version': want_version,
    }


@pytest.mark.parametrize('packaged', [False, True])
def test_runtime_environment_cannot_supply_or_override_identity(metadata, monkeypatch, packaged):
    from wiki.build_identity import application_identity
    monkeypatch.setenv('BACKSTORY_BUILD_REVISION', 'b' * 40)
    monkeypatch.setenv('BACKSTORY_BUILD_VERSION', '9.9.9')
    monkeypatch.setenv('BACKSTORY_REVISION', 'b' * 40)
    monkeypatch.setenv('BACKSTORY_VERSION', '9.9.9')
    if packaged:
        metadata.write_text(json.dumps({'build': 'a' * 40, 'version': '1.4.0'}))
    assert application_identity() == {
        'name': 'Backstory', 'build': 'a' * 40 if packaged else 'unknown',
        'version': '1.4.0' if packaged else 'unknown',
    }


@pytest.mark.parametrize(('version', 'build', 'want_version', 'want_build'), [
    ('1.4.0', 'a' * 40, '1.4.0', 'a' * 40),
    ('1.4.0-dev.12.gaaaaaaaaaaaa', 'a' * 40, '1.4.0-dev.12.gaaaaaaaaaaaa', 'a' * 40),
    ('unknown', 'unknown', 'unknown', 'unknown'),
    ('private-version', '/private/source', 'unknown', 'unknown'),
])
def test_packaging_cli_round_trip_outside_repository(tmp_path, version, build, want_version, want_build):
    package = tmp_path / 'wiki'
    package.mkdir()
    (package / '__init__.py').touch()
    shutil.copyfile(Path(__file__).resolve().parents[2] / 'wiki/build_identity.py',
                    package / 'build_identity.py')
    # Package-time code must replace stale metadata copied from a working tree.
    metadata = package / '_build_identity.json'
    metadata.write_text('{"version":"9.9.9","build":"' + 'b' * 40 + '"}')
    subprocess.run([sys.executable, '-m', 'wiki.build_identity', version, build],
                   cwd=tmp_path, check=True, capture_output=True, text=True)
    assert json.loads(metadata.read_text()) == {'build': want_build, 'version': want_version}
    result = subprocess.run([sys.executable, '-c',
        'import json; from wiki.build_identity import application_identity; '
        'print(json.dumps(application_identity()))'],
        cwd=tmp_path, check=True, capture_output=True, text=True)
    assert json.loads(result.stdout) == {
        'name': 'Backstory', 'build': want_build, 'version': want_version,
    }
