"""Package-time release identity; never infer it from runtime settings or Git."""
import json
from pathlib import Path
import re

_METADATA_PATH = Path(__file__).with_name('_build_identity.json')
_NUMBER = r'(?:0|[1-9][0-9]*)'
_VERSION = re.compile(rf'{_NUMBER}\.{_NUMBER}\.{_NUMBER}(?:-dev\.{_NUMBER}\.g[0-9a-f]{{12}})?')


def _validated_fields(metadata):
    build, version = metadata.get('build'), metadata.get('version')
    return {
        'build': build if isinstance(build, str) and re.fullmatch(r'[0-9a-f]{40}', build) else 'unknown',
        'version': version if isinstance(version, str) and len(version) <= 80 and _VERSION.fullmatch(version) else 'unknown',
    }


def application_identity():
    metadata = {}
    try:
        with _METADATA_PATH.open('rb') as packaged:
            raw = packaged.read(1025)
        if len(raw) <= 1024:
            decoded = json.loads(raw.decode('utf-8'))
            if isinstance(decoded, dict):
                metadata = decoded
    except (OSError, ValueError, RecursionError):
        # Identity must never break status or disclose raw metadata/read errors.
        pass
    return {'name': 'Backstory', **_validated_fields(metadata)}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Bake release identity into this application package.')
    parser.add_argument('version')
    parser.add_argument('revision')
    args = parser.parse_args()
    fields = _validated_fields({'build': args.revision, 'version': args.version})
    _METADATA_PATH.write_text(json.dumps(fields) + '\n', encoding='utf-8')
