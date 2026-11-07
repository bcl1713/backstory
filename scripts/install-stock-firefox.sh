#!/usr/bin/env bash
set -euo pipefail
destination=${1:?Pass a new directory for the pinned browser tools}
mkdir -- "$destination"
cd -- "$destination"
base=https://ftp.mozilla.org/pub/firefox/releases/155.0.1
curl --fail --silent --show-error --location "$base/linux-x86_64/en-US/firefox-155.0.1.tar.xz" --output firefox.tar.xz
curl --fail --silent --show-error --location "$base/SHA256SUMS" --output SHA256SUMS
python3 - <<'PYVERIFY'
import hashlib
from pathlib import Path
expected = [line.split()[0] for line in Path('SHA256SUMS').read_text().splitlines()
            if line.split()[-1] == 'linux-x86_64/en-US/firefox-155.0.1.tar.xz']
assert len(expected) == 1
assert hashlib.sha256(Path('firefox.tar.xz').read_bytes()).hexdigest() == expected[0]
PYVERIFY
echo '642ab731354a5ca790b894d4556dfb5028c61d0c24eb10d10e10a111a69c89bf  firefox.tar.xz' | sha256sum --check
tar -xJf firefox.tar.xz
curl --fail --silent --show-error --location https://github.com/mozilla/geckodriver/releases/download/v0.37.1/geckodriver-v0.37.1-linux64.tar.gz --output geckodriver.tar.gz
echo 'e815130ea95983e162ae91843b48d3a3ce991735635fce83a647afde21e09f7e  geckodriver.tar.gz' | sha256sum --check
tar -xzf geckodriver.tar.gz
