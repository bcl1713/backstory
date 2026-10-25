"""Generate disposable synthetic storage. Refuse every existing destination."""
import argparse
from dataclasses import dataclass
from datetime import date, timedelta
import hashlib
import json
from pathlib import Path
import shlex
from typing import Literal


@dataclass(frozen=True)
class FixtureManifest:
    wiki_root: Path
    data_dir: Path
    config_path: Path
    manifest_path: Path
    identity_path: str
    identity_sha256: str


def generate_fixture(destination: Path, profile: Literal["small", "representative"]) -> FixtureManifest:
    if profile not in {"small", "representative"}:
        raise ValueError("Unknown fixture profile")
    destination = destination.absolute()
    destination.mkdir(parents=True, exist_ok=False)
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
            (wiki / folder / name).write_text(
                f"---\ntitle: Synthetic note {count}\nid: synthetic-{count}\ntags: [fixture]\n---\n\n"
                f"# Synthetic note {count}\n\nDisposable café content. [[notes/Note 0000]]\n\n"
                "- A synthetic list item\n  - A nested item\n", encoding="utf-8")
            count += 1
    config = destination / "fixture.env"
    values = {
        "BACKSTORY_WIKI_ROOT": str(wiki), "BACKSTORY_DATA_DIR": str(destination / "data"),
        "BACKSTORY_IDENTITY_PATH": identity_path, "BACKSTORY_IDENTITY_SHA256": digest,
        "BACKSTORY_COOKIE_MODE": "localhost", "BACKSTORY_ALLOWED_HOSTS": "localhost,127.0.0.1,[::1]",
    }
    config.write_text("".join(f"{key}={shlex.quote(value)}\n" for key, value in values.items()))
    manifest_path = destination / "manifest.json"
    manifest_path.write_text(json.dumps({"profile": profile, "note_count": count, **values}, indent=2) + "\n")
    return FixtureManifest(wiki, destination / "data", config, manifest_path, identity_path, digest)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--profile", choices=["small", "representative"], default="small")
    args = parser.parse_args()
    result = generate_fixture(args.destination, args.profile)
    print(f"Synthetic fixture created. Configuration: {result.config_path}")


if __name__ == "__main__":
    main()
