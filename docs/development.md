# Local development

For a Compose installation or an existing wiki, start with the [setup guide](setup.md).
This page covers native development against generated disposable data.
See the [configuration reference](configuration.md) for the complete environment
inventory. Native commands do not load a Compose `.env`; export actual native
wiki/data roots to both processes. Container mount-source values are different.

Use generated synthetic storage only. Install Python 3.14, uv 0.12.19 and
Node 22 LTS (22.12 or newer). Lockfiles pin dependencies; the image pins Python
3.14.9 and Node 22.23.4. Choose a previously nonexistent fixture directory:

```sh
uv sync --frozen
npm ci
npm run build
uv run python -m tests.fixtures.generate /tmp/backstory-demo --profile representative
set -a
. /tmp/backstory-demo/fixture.env
set +a
uv run python manage.py check
uv run python manage.py migrate
uv run python manage.py collectstatic --noinput
uv run python manage.py create_account
uv run gunicorn backstory.wsgi:application --logger-class backstory.logging.SafeGunicornLogger --no-control-socket --bind 127.0.0.1:8000 --workers 1 --threads 4 --access-logfile /dev/null
```

In a second terminal, load the same fixture configuration and run
`uv run python manage.py run_indexer`. Visit
<http://127.0.0.1:8000/accounts/login/>. Repeat interactive `create_account` for
an assistant account. Password input is hidden and validated; no password
arguments, default accounts or registration endpoint exist.

The `small` profile creates 12 notes. `representative` creates exactly 1,000,
including 299 date-named dailies and a 699,000-byte `reference/Large.md`, plus
inert generated PNG/PDF assets. Layout: Home 1, notes 300, projects/active 150,
projects/archive 100, reference 100, templates 50, daily 299. Unknown/nested YAML,
malformed YAML, links, tables, Unicode, BOM and mixed newlines are synthetic.
The fixture's `.backstory-marker` signals storage presence; `Home.md` remains an
ordinary editable note. Manifest and
configuration live outside the wiki. Generation refuses every existing target.

For containers generate a **new** fixture with `--for-containers`; follow
[operations](operations.md). That opt-in grants write access only to new public
synthetic wiki directories/files, without changing ownership. It never repairs
an existing fixture or live storage.

Run correctness checks against disposable roots:

```sh
uv run pytest
# Same parallel Python execution used in CI:
uv run pytest -n 2 --dist loadfile --durations=20
npm run test:formatter
npx playwright install chromium
npm run test:browser
```

Browser tests own `/tmp/backstory-release-one/browser-runtime`, bind only
127.0.0.1:8765 and use synthetic accounts. Playwright writes artifacts under
`/tmp/backstory-release-one/reports`. They never load the caller's configured
wiki. Python tests create and clean their own temporary roots. Formatter tests
invoke the real packaged helper. There are no latency gates or benchmarks.

CI runs four browser shards on separate runners, each with its own server. To
run one shard locally use `npm run test:browser -- --shard=1/4`. Run local shards
one at a time: they share the runtime directory and port. Keep Playwright's
worker count at one. CI installs Chromium with `--only-shell` to reduce download
time and retains failure traces/screenshots as artifacts.

Concurrent checkouts can isolate browser tests with both
`BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-my-task` and
`BACKSTORY_BROWSER_PORT=8868`. Use a distinct disposable root and loopback port
for each run; tests within a run still share one worker and synthetic wiki.

Open ordinary PRs against `dev`; successful dev merges publish a prerelease and
`:dev` image. Promote through a `dev` → `main` merge PR for stable publication.
See [release automation](releases.md) for branch protection, versioning and
separate test/production stacks.

Default production configuration is HTTPS with Secure cookies, HSTS and explicit
hosts/origins. Local fixtures explicitly select localhost mode and proxy mode
`off`, which ignores forwarded headers. Opt-in `trusted` mode follows the
[generic HTTPS proxy contract](reverse-proxy.md); focused backend checks and a
generated TLS fixture passed, with combined review/rebuilt-image acceptance still
pending. HTTPS deployment must satisfy
`python manage.py check --deploy --fail-level WARNING`.
Never enable access logs of private paths/search terms or log request bodies,
cookies, credentials or source. See [limitations](limitations.md) for NFS and
external-writer boundaries and the retained low npm advisory.
