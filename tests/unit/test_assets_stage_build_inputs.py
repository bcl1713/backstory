"""Exercise exactly the asset-stage COPY context, without a Docker daemon."""
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tempfile

import pytest

ROOT = Path(__file__).parents[2]


def asset_copies():
    stage = (ROOT / "Dockerfile").read_text().split(" AS assets\n", 1)[1].split("\nFROM ", 1)[0]
    return [shlex.split(line)[1:] for line in stage.splitlines() if line.startswith("COPY ")]


def copied_files():
    return {source for instruction in asset_copies() for source in instruction[:-1]}


def test_assets_stage_contains_the_complete_local_build_script_graph():
    copied = copied_files()
    pending = [Path("scripts/build-assets.mjs")]
    visited = set()
    while pending:
        script = pending.pop()
        if script in visited:
            continue
        visited.add(script)
        assert script.as_posix() in copied, f"asset stage does not copy required build helper: {script}"
        code = (ROOT / script).read_text()
        for relative in re.findall(r"(?:from\s*|import\(\s*)['\"](\./[^'\"]+\.mjs)['\"]", code):
            pending.append(script.parent / relative)


def test_assets_build_succeeds_with_only_declared_docker_copy_inputs():
    if not shutil.which("node") or not (ROOT / "node_modules").is_dir():
        pytest.skip("Node and installed asset dependencies are required")
    # Keep this temporary tree on the checkout's filesystem so read-only
    # dependencies can be hard-linked, not copied or resolved through symlinks.
    # Build helpers use their node_modules path for pinned loader validation.
    with tempfile.TemporaryDirectory(prefix=".asset-stage-test-", dir=ROOT) as temporary:
        stage = Path(temporary)
        for instruction in asset_copies():
            sources, destination = instruction[:-1], instruction[-1]
            for source in sources:
                original = ROOT / source
                target = stage / destination
                if len(sources) > 1 or destination.endswith("/"):
                    target /= original.name
                target.parent.mkdir(parents=True, exist_ok=True)
                if original.is_dir():
                    shutil.copytree(original, target)
                else:
                    shutil.copyfile(original, target)
        shutil.copytree(ROOT / "node_modules", stage / "node_modules", symlinks=True, copy_function=os.link)
        result = subprocess.run(["node", "scripts/build-assets.mjs"], cwd=stage, capture_output=True, text=True, timeout=60)
        assert result.returncode == 0, result.stderr
        manifest = json.loads((stage / "static/renderers/manifest.json").read_text())
        assert manifest["outputs"] == 1 and manifest["imports"] == []
        assert (stage / "static/renderers" / manifest["frame"]).is_file()
        assert (stage / "static/editor.js").is_file()
        assert (stage / "static/math-renderer.js").is_file()
        assert (stage / "static/licenses/mermaid/NOTICE.txt").is_file()
