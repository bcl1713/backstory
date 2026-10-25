# Local development

The runtime provides login, interactive accounts and protected lazy browsing.
Editing, formatting and indexing arrive in subsequent tasks. Develop against
generated synthetic storage only. Never use a private wiki or authentication file as a fixture.

Install Python 3.14, uv 0.12.19 and Node 22 LTS (22.12 or newer). Dependencies are
pinned in `pyproject.toml` and `package.json`, including transitive lockfiles.
The container pins Python 3.14.9 and Node 22.23.4. Use an explicitly disposable,
previously nonexistent directory outside the checkout:

```sh
uv sync --frozen
npm ci
npm run build
uv run python -m tests.fixtures.generate /tmp/backstory-demo --profile small
set -a
. /tmp/backstory-demo/fixture.env
set +a
uv run python manage.py check
uv run python manage.py migrate
uv run python manage.py collectstatic --noinput
uv run python manage.py create_account
uv run gunicorn backstory.wsgi:application --bind 127.0.0.1:8000 --workers 1 --threads 4 --access-logfile /dev/null
```

Visit <http://127.0.0.1:8000/accounts/login/>. Account creation prompts for a
username and a password twice. Password entry is hidden; a terminal is required.
There is no password argument, default account or registration endpoint. Repeat
`create_account` for a separately revocable ordinary assistant account. Passwords
use Argon2 and Django's validators. A failed login returns a generic error.

`small` creates 12 synthetic Markdown notes in `notes/`, `projects/active/`,
`projects/archive/`, `reference/`, `templates/` and `daily/2026/`, with generated
inert PNG/PDF samples in `attachments/`. `representative` creates exactly 1,000
notes, including 299 dailies, varied YAML/Markdown preservation cases and a
699,000-byte `reference/Large.md`. `Home.md` is the synthetic identity file; leave it unchanged
in ordinary edit tests. Fixture generation refuses every existing destination.
Its configuration and manifest are outside the wiki. Neither fixture profile
contains copied authentication files or private content.

The wiki root is never created by application startup. Wiki and data roots must
be absolute, distinct and non-overlapping, including through symlinks. Missing
wiki storage still permits login and signed-in status; storage reads are refused
until the configured identity check succeeds. See [storage policy](storage.md)
for exclusions, diagnostics, limits and cursor restart behavior. Identity
configuration is a relative file path plus its expected SHA-256, set outside the
wiki. Never enroll storage automatically or select a sensitive identity file.

SQLite accounts/sessions and the generated `application-secret` live in the data
root. The application publishes a new secret atomically only when absent, with
mode 0600, and reuses it across restart. Keep this state on local storage and
protect it together with future revisions/drafts. Do not copy it into an image
or commit it. Restoring accounts/sessions requires the same secret.

## Local Compose

The initial Compose service is web-only, using Gunicorn as UID/GID 10001 and a
named application-data volume. It binds only `127.0.0.1:8000`. The explicit bind
mount refuses to create a missing source (`create_host_path: false`). Generate a
**new** disposable fixture specifically for containers, then load its configuration:

```sh
uv run python -m tests.fixtures.generate /tmp/backstory-compose-demo --profile small --for-containers
set -a
. /tmp/backstory-compose-demo/fixture.env
set +a
docker compose config --quiet
docker compose build
docker compose run --rm web python manage.py migrate
docker compose run --rm web python manage.py create_account
docker compose up -d
```

Use the same login URL. Restart with `docker compose restart`; the volume keeps
accounts, sessions and secret material. `docker compose down` retains that volume.
Use `down --volumes` only when intentionally discarding this disposable project.
`--for-containers` is only for newly generated public synthetic test data. It
creates wiki directories with mode 0777 and files with mode 0666 so an arbitrary
non-root container UID can read and write the bind-mounted wiki, including with
rootless UID mapping. It preserves file bytes and ownership. Construction stays
inside a private mode-0700 outer directory; configuration and manifest use mode
0600. Only the wiki is made public. The flag refuses every existing destination
and cannot repair or change an existing fixture or live wiki. Ordinary generation
without the flag keeps its usual permissions.

The runtime UID/GID 10001 is separate from the host Docker group: Docker access
does not grant that runtime process write access to bind-mounted host files.
Keep application data private and writable by the container's mapped runtime
UID; the Compose named application-data volume is separate from this fixture
preparation. A successful storage identity check proves the configured bytes
were readable, and does not prove that saving is writable.

For a production wiki, compatible UID/GID and filesystem permissions are an
administrator prerequisite outside this disposable workflow's authorization.
Backstory does not automatically chmod/chown live storage or run the web process
as root to bypass permissions. Task 7 adds the supervised index worker.

Managed build environments may require their proxy CA. Preserve the configured
Docker endpoint and proxy defaults, then build with the public CA bundle mounted
as a BuildKit secret (no certificate or credentials are copied into image layers):

```sh
docker build --secret id=proxy_ca,src=/etc/ssl/certs/ca-certificates.crt -t backstory:local .
```

This secret is optional on ordinary networks. Keep TLS verification enabled.

## Configuration and checks

`BACKSTORY_COOKIE_MODE=localhost` explicitly enables HTTP cookies and permits
only loopback hosts. This mode is for disposable local use. The default `https`
mode uses Secure cookies, HTTPS redirection and HSTS. Both modes require explicit
allowed hosts; wildcard hosts are rejected. No forwarded proxy headers are
trusted by default. A future owner-authorized HTTPS deployment must validate
its proxy boundary and run `python manage.py check --deploy --fail-level WARNING`.
The supplied Compose workflow deliberately selects localhost mode.

Run `uv run pytest tests/integration/test_bootstrap.py` for root/fixture/auth
contracts. The policy, storage and browsing suites check confined storage and
lazy browsing:

```sh
uv run pytest tests/unit/test_policy.py tests/integration/test_storage.py tests/integration/test_browsing.py
```

Runtime checks validate SQLite FTS5 support. Browser and formatter commands are reserved as
`npm run test:browser` and `npm run test:formatter`; those suites and the
Playwright dependency are introduced by their owning tasks and are not yet
available. No service worker or note cache is installed.

Do not enable access logs containing content URLs or log request bodies, cookies,
passwords, secret material or note text. The documented Gunicorn command disables
access logs. This synthetic local workflow cannot establish NFS/TrueNAS durability
or coordination guarantees against uncooperative external writers.
