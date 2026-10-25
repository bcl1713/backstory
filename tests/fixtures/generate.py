"""Generate disposable synthetic storage. Refuse every existing destination."""
import argparse
from dataclasses import dataclass
from datetime import date, timedelta
import hashlib
import json
import os
from pathlib import Path
import shlex
import stat
import struct
from typing import Literal
import zlib


@dataclass(frozen=True)
class FixtureManifest:
    wiki_root: Path
    data_dir: Path
    config_path: Path
    manifest_path: Path
    identity_path: str
    identity_sha256: str


def _note_source(number: int, case: int | None = None) -> bytes:
    """Public, deterministic test strings; no disk-derived content."""
    duplicate = case in {0, 7}
    metadata = (
        f'title: "Synthetic note {number}: café"\n'
        f'id: {"synthetic-duplicate" if duplicate else f"synthetic-{number}"}\n'
        'aliases: ["Shared synthetic alias", "Quoted: alias"]\n'
        'tags: [fixture, "synthetic/nested", "東京"]\n'
        'unknown_fixture:\n'
        '  enabled: true\n  disabled: false\n  count: 7\n  ratio: 1.25\n  absent: null\n'
        '  date_text: "2026-01-02"\n  date_like: 2026-01-03\n'
        '  quoted_boolean: "false"\n  quoted_number: "007"\n'
        '  nested:\n    - label: "A \\"quoted\\" value"\n      values: [null, true, 4, "four"]\n'
        '  literal: |\n    Synthetic multiline text.\n    A second public test line.\n'
    )
    if not duplicate:
        metadata = metadata.replace('"Shared synthetic alias"', f'"Synthetic alias {number}"')
    if case == 5:
        metadata += 'broken: [unterminated\n'
    elif case == 6:
        metadata += 'duplicate_key: first\nduplicate_key: second\n'
    elif case == 8:
        metadata += 'unsupported: !synthetic inert-public-string\n'
    elif case == 9:
        metadata += 'cycle: &fixture_cycle [*fixture_cycle]\n'
    body = (
        f'# Synthetic note {number}\n\n'
        '## Synthetic heading\n\n'
        'Disposable café content: 東京, naïve, Ελληνικά, and 🧪. **Strong** and *emphasis*.\n\n'
        '[[notes/Note 0001#synthetic-heading|Synthetic alias]] and [[synthetic-duplicate]].\n\n'
        '[relative](../reference/Note%200000.md#synthetic-heading) and '
        '[public external](https://example.invalid/synthetic?q=fixture#fragment).\n\n'
        '![sample](../attachments/sample.png) [PDF](../attachments/sample.pdf)\n\n'
        '![missing](../attachments/missing.png) and [[missing synthetic note]].\n\n'
        '| Column | Value |\n| --- | --- |\n| café | `literal` |\n| 東京 | 7 |\n\n'
        '- [ ] Synthetic unfinished task\n- [x] Synthetic complete task\n'
        '  - Nested synthetic item\n    1. Nested ordered item\n\n'
        '> A synthetic quotation.\n\n'
        '`[[inline-false-positive]]` and `[inline fake](not-a-real-edge.md)`.\n\n'
        '```text\n[[fenced-false-positive]]\n[fenced fake](not-a-real-edge.md)\n```\n'
    )
    source = f'---\n{metadata}---\n\n{body}'
    if case == 10:
        source = '---\nbroken: "unterminated\n\n' + body
    if case == 1:
        source = source.replace('\n', '\r\n')
    elif case == 2:
        source = '\ufeff' + source
    elif case == 3:
        source = source.replace('\n', '\r\n', 4)
    elif case == 4:
        source = source.rstrip('\n')
    return source.encode('utf-8')


def _attachments(wiki: Path) -> None:
    """Construct inert raster/PDF samples rather than copying assets."""
    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (struct.pack('!I', len(payload)) + kind + payload
                + struct.pack('!I', zlib.crc32(kind + payload)))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('!2I5B', 1, 1, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(b'\x00\x40\x80\xc0')) + chunk(b'IEND', b''))
    (wiki / 'attachments/sample.png').write_bytes(png)
    stream = b'BT /F1 12 Tf 20 100 Td (Synthetic public fixture) Tj ET\n'
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>',
               b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
               b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 140] '
               b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
               b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
               f'<< /Length {len(stream)} >>\nstream\n'.encode() + stream + b'endstream']
    pdf = b'%PDF-1.4\n'
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += f'{index} 0 obj\n'.encode() + obj + b'\nendobj\n'
    xref = len(pdf)
    pdf += b'xref\n0 6\n0000000000 65535 f \n'
    pdf += b''.join(f'{offset:010d} 00000 n \n'.encode() for offset in offsets[1:])
    pdf += f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()
    (wiki / 'attachments/sample.pdf').write_bytes(pdf)


def _publish_container_wiki(wiki: Path) -> None:
    """Publish only the just-built public test tree, using no-follow descriptors."""
    for _, directories, files, directory_fd in os.fwalk(wiki, topdown=False, follow_symlinks=False):
        for name in directories:
            if not stat.S_ISDIR(os.stat(name, dir_fd=directory_fd, follow_symlinks=False).st_mode):
                raise ValueError("Unexpected non-directory in synthetic fixture")
        for name in files:
            fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory_fd)
            try:
                if not stat.S_ISREG(os.fstat(fd).st_mode):
                    raise ValueError("Unexpected non-regular synthetic fixture file")
                os.fchmod(fd, 0o666)
            finally:
                os.close(fd)
        os.fchmod(directory_fd, 0o777)


def generate_fixture(destination: Path, profile: Literal["small", "representative"],
                     *, for_containers: bool = False) -> FixtureManifest:
    if profile not in {"small", "representative"}:
        raise ValueError("Unknown fixture profile")
    destination = destination.absolute()
    destination.mkdir(parents=True, exist_ok=False, mode=0o700 if for_containers else 0o777)
    if for_containers:
        fd = os.open(destination, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fchmod(fd, 0o700)
        finally:
            os.close(fd)
    wiki = destination / "wiki"
    wiki.mkdir()
    identity_path = "Home.md"
    identity = b"# Home\n\nBackstory disposable synthetic storage, version 1.\n"
    (wiki / identity_path).write_bytes(identity)
    digest = hashlib.sha256(identity).hexdigest()
    directories = ["notes", "projects/active", "projects/archive", "reference", "templates", "daily/2026"]
    counts = [300, 150, 100, 100, 50, 299] if profile == "representative" else [3, 2, 1, 2, 1, 2]
    (wiki / "attachments").mkdir()
    count = 1
    for folder, folder_count in zip(directories, counts):
        (wiki / folder).mkdir(parents=True)
        for index in range(folder_count):
            name = f"{date(2026, 1, 1) + timedelta(days=index)}.md" if folder.startswith("daily/") else f"Note {index:04}.md"
            raw = _note_source(count, index if folder == "notes" else None)
            if profile == "representative" and folder == "reference" and index == folder_count - 1:
                name = "Large.md"
                # ASCII padding keeps the UTF-8 byte count exact without splitting Unicode.
                prefix = raw + b'\n'
                paragraph = b'Synthetic large-note paragraph for bounded source editing.\n\n'
                remaining = 699000 - len(prefix)
                raw = prefix + (paragraph * (remaining // len(paragraph))) + b'x' * (remaining % len(paragraph))
            (wiki / folder / name).write_bytes(raw)
            count += 1
    _attachments(wiki)
    config = destination / "fixture.env"
    values = {
        "BACKSTORY_WIKI_ROOT": str(wiki), "BACKSTORY_DATA_DIR": str(destination / "data"),
        "BACKSTORY_IDENTITY_PATH": identity_path, "BACKSTORY_IDENTITY_SHA256": digest,
        "BACKSTORY_COOKIE_MODE": "localhost", "BACKSTORY_ALLOWED_HOSTS": "localhost,127.0.0.1,[::1]",
    }
    config.write_text("".join(f"{key}={shlex.quote(value)}\n" for key, value in values.items()))
    manifest_path = destination / "manifest.json"
    files = []
    for path in sorted(wiki.rglob("*")):
        if path.is_file():
            raw = path.read_bytes()
            files.append({"path": path.relative_to(wiki).as_posix(), "bytes": len(raw),
                          "sha256": hashlib.sha256(raw).hexdigest()})
    manifest_path.write_text(json.dumps({
        "profile": profile, "note_count": count, "daily_count": counts[-1],
        "identity_path": identity_path, "identity_sha256": digest,
        "folder_counts": dict(zip(directories, counts)), "files": files, **values,
    }, indent=2) + "\n", encoding="utf-8")
    if for_containers:
        for path in (config, manifest_path):
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
            try:
                os.fchmod(fd, 0o600)
            finally:
                os.close(fd)
        # The private outer directory stays 0700; only wiki is bind-mounted.
        # Never apply this operation to an existing destination or application data.
        _publish_container_wiki(wiki)
    return FixtureManifest(wiki, destination / "data", config, manifest_path, identity_path, digest)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--profile", choices=["small", "representative"], default="small")
    parser.add_argument("--for-containers", action="store_true",
                        help="Make only newly generated public synthetic wiki files container-writable")
    args = parser.parse_args()
    result = generate_fixture(args.destination, args.profile, for_containers=args.for_containers)
    print(f"Synthetic fixture created. Configuration: {result.config_path}")


if __name__ == "__main__":
    main()
