# Local development

For a Compose installation or an existing wiki, start with the [setup guide](setup.md).
This page covers native development against generated disposable data.

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
Keep `Home.md` unchanged: it is this fixture's storage identity. Manifest and
configuration live outside the wiki. Generation refuses every existing target.

For containers generate a **new** fixture with `--for-containers`; follow
[operations](operations.md). That opt-in grants write access only to new public
synthetic wiki directories/files, without changing ownership. It never repairs
an existing fixture or live storage.

Run correctness checks against disposable roots:

```sh
uv run pytest
npm run test:formatter
npx playwright install chromium
npm run test:browser
```

Browser tests own `/tmp/backstory-release-one/browser-runtime`, bind only
127.0.0.1:8765 and use synthetic accounts. Playwright writes artifacts under
`/tmp/backstory-release-one/reports`. They never load the caller's configured
wiki. Python tests create and clean their own temporary roots. Formatter tests
invoke the real packaged helper. There are no latency gates or benchmarks.

Default production configuration is HTTPS with Secure cookies, HSTS and explicit
hosts/origins. Local fixtures explicitly select localhost mode. No proxy headers
are trusted; proxy mode is currently unsupported and fails closed. Future HTTPS
deployment must satisfy `python manage.py check --deploy --fail-level WARNING`.
Never enable access logs of private paths/search terms or log request bodies,
cookies, credentials or source. See [limitations](limitations.md) for NFS and
external-writer boundaries and the retained low npm advisory.
