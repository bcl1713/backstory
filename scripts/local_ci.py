#!/usr/bin/env python3
"""Run the complete synthetic correctness gate locally, without GitHub Actions.

Requires a trusted Linux x86_64 executor with Docker, uv 0.12.19, Node 22.23.4,
and installed Playwright OS dependencies. No publication or live deployment.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import platform
import shutil
import signal
import subprocess
import tempfile
import time
import uuid


ROOT = Path(__file__).resolve().parents[1]
RECEIPT_SCHEMA = 2


def branch_policy(base, head):
    if base == 'main' and head != 'dev':
        raise ValueError('Promote this repository dev branch to main; feature PRs target dev.')


def build_plan(report, port):
    report = Path(report).resolve()
    def step(name, command, env=None):
        return dict(name=name, command=command, env=env or {})
    def browser(name):
        return dict(BACKSTORY_BROWSER_RUNTIME=str(report / name),
                    BACKSTORY_BROWSER_PORT=str(port))
    container = '''
uv run python -m tests.fixtures.generate "$LOCAL_REPORT/container-fixture" --profile small --for-containers
set -a
. "$LOCAL_REPORT/container-fixture/fixture.env"
set +a
export BACKSTORY_IMAGE="backstory:local-ci-$LOCAL_RUN_ID"
# Both the fixture and project name are unique to this run. Never use a real stack.
export COMPOSE_PROJECT_NAME="backstory-ci-$LOCAL_RUN_ID"
cleanup() { docker compose --env-file "$LOCAL_REPORT/container-fixture/fixture.env" -f compose.yaml down --volumes; }
trap cleanup EXIT
uv run python manage.py check
BACKSTORY_COOKIE_MODE=https BACKSTORY_ALLOWED_HOSTS=example.invalid uv run python manage.py check --deploy --fail-level WARNING
docker compose --env-file "$LOCAL_REPORT/container-fixture/fixture.env" -f compose.yaml config --quiet
# Match publication's immutable context and canonical Git file permissions.
git archive --format=tar HEAD | docker build --tag "$BACKSTORY_IMAGE" -
docker compose --env-file "$LOCAL_REPORT/container-fixture/fixture.env" -f compose.yaml run --pull never --rm web python manage.py check
'''
    return [
        step('dependencies', 'uv sync --frozen --python 3.14\nnpm ci'),
        step('build', 'npm run build'),
        step('python', 'uv run pytest -n 2 --dist loadfile --durations=20'),
        step('formatter', 'npm run test:formatter'),
        step('browser-install', 'npx playwright install firefox'),
        step('firefox-code', 'npx playwright test --config=playwright.code.config.js', browser('firefox-code')),
        step('firefox-renderers', 'npx playwright test --config=playwright.firefox.config.js', browser('firefox-renderers')),
        step('container', container),
    ]


def source_identity(root):
    subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--'], cwd=root, check=True)
    untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=root, text=True)
    if untracked.strip():
        raise ValueError('Commit or remove untracked source before producing CI evidence.')
    return tuple(subprocess.check_output(['git', 'rev-parse', ref], cwd=root, text=True).strip()
                 for ref in ('HEAD', 'HEAD^{tree}'))


def validate_receipt(receipt, source_sha, source_tree):
    gates = {step['name'] for step in build_plan(Path('/tmp/unused'), 18765)}
    if (receipt.get('schema') != RECEIPT_SCHEMA or receipt.get('source_sha') != source_sha
            or receipt.get('source_tree') != source_tree
            or set(receipt.get('gates', {})) != gates
            or any(value != 'passed' for value in receipt['gates'].values())):
        raise ValueError('A full successful local CI receipt for this exact clean commit is required.')


def process_table():
    table = {}
    for entry in Path('/proc').iterdir():
        if not entry.name.isdigit():
            continue
        try:
            # comm can contain spaces and parentheses; fields follow its last ')'.
            fields = (entry / 'stat').read_text().rsplit(')', 1)[1].split()
            table[int(entry.name)] = (fields[0], int(fields[1]), int(fields[2]), fields[19])
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            pass
    return table


def stop_process_tree(process, grace=5):
    # Already-reparented orphans cannot be attributed safely; see the runbook.
    table = process_table()
    owned = {process.pid: table[process.pid][3]} if process.pid in table else {}
    signaled = set()

    def discover(table):
        while True:
            children = {pid: info[3] for pid, info in table.items()
                        if info[1] in owned and info[1] in table
                        and table[info[1]][3] == owned[info[1]] and pid not in owned}
            if not children:
                return
            owned.update(children)

    def signal_owned(pid, sig):
        # pidfd keeps a PID reused after this check from targeting a new process.
        try:
            fd = os.pidfd_open(pid)
        except ProcessLookupError:
            return
        try:
            current = process_table().get(pid)
            if current and current[3] == owned[pid] and current[0] != 'Z':
                signal.pidfd_send_signal(fd, sig)
        except ProcessLookupError:
            pass
        finally:
            os.close(fd)

    discover(table)
    deadline = time.monotonic() + grace
    while True:
        discover(table)
        alive = [pid for pid in owned if pid in table and table[pid][3] == owned[pid]
                 and table[pid][0] != 'Z']
        for pid in alive:
            if pid not in signaled:
                signal_owned(pid, signal.SIGTERM)
                signaled.add(pid)
        if not alive or time.monotonic() >= deadline:
            break
        time.sleep(0.05)
        table = process_table()
    for pid in alive:
        signal_owned(pid, signal.SIGKILL)
    process.wait()


def run_process(args, *, timeout=3600, **kwargs):
    # Track descendants too: browser probes may create detached sessions.
    process = subprocess.Popen(args, start_new_session=True, **kwargs)
    try:
        status = process.wait(timeout=timeout)
        if status:
            raise subprocess.CalledProcessError(status, args)
    except BaseException:
        stop_process_tree(process)
        raise


def run_step(step, root, report):
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(('BACKSTORY_', 'COMPOSE_', 'DJANGO_', 'GITHUB_', 'PYTEST_'))
           and key not in ('GH_TOKEN', 'GH_HOST', 'UV_PROJECT_ENVIRONMENT', 'PYTHONPATH',
                           'PYTHONHOME', 'PYTHONOPTIMIZE', 'NODE_OPTIONS')}
    env.update(step['env'], LOCAL_REPORT=str(report), LOCAL_RUN_ID=uuid.uuid4().hex, CI='1')
    if step['name'] == 'container':
        env.update(BACKSTORY_IMAGE='backstory:local-ci-' + env['LOCAL_RUN_ID'],
                   COMPOSE_PROJECT_NAME='backstory-ci-' + env['LOCAL_RUN_ID'])
    with (report / (step['name'] + '.log')).open('w') as log:
        try:
            run_process(['bash', '-euo', 'pipefail', '-c', step['command']], cwd=root,
                        env=env, stdout=log, stderr=subprocess.STDOUT)
        finally:
            fixture = report / 'container-fixture/fixture.env'
            if step['name'] == 'container' and fixture.is_file():
                # Also runs after timeout/interrupt, when bash's trap may not run.
                run_process(['docker', 'compose', '--env-file', str(fixture), '-f',
                             'compose.yaml', 'down', '--volumes'], cwd=root, env=env,
                            stdout=log, stderr=subprocess.STDOUT, timeout=120)


def run_suite(root, report, port):
    source_sha, source_tree = source_identity(root)
    record = dict(schema=RECEIPT_SCHEMA, source_sha=source_sha, source_tree=source_tree,
                  started_at=datetime.now(timezone.utc).isoformat(), gates={})
    for step in build_plan(report, port):
        print('Running ' + step['name'], flush=True)
        record['gates'][step['name']] = 'running'
        (report / 'status.json').write_text(json.dumps(record, indent=2) + '\n')
        try:
            run_step(step, root, report)
        except BaseException:
            record['gates'][step['name']] = 'failed'
            (report / 'status.json').write_text(json.dumps(record, indent=2) + '\n')
            raise
        record['gates'][step['name']] = 'passed'
    if source_identity(root) != (source_sha, source_tree):
        raise ValueError('Source changed while tests were running; receipt refused.')
    record['completed_at'] = datetime.now(timezone.utc).isoformat()
    validate_receipt(record, source_sha, source_tree)
    (report / 'status.json').write_text(json.dumps(record, indent=2) + '\n')
    (report / 'receipt.json').write_text(json.dumps(record, indent=2) + '\n')
    return record


def preflight():
    if platform.system() != 'Linux' or platform.machine() != 'x86_64':
        raise ValueError('Full parity currently requires Linux x86_64 for the pinned Playwright Firefox runtime.')
    if not hasattr(os, 'pidfd_open') or not hasattr(signal, 'pidfd_send_signal'):
        raise ValueError('Use Python 3.9+ with Linux pidfd support for scoped process cleanup.')
    try:
        os.close(os.pidfd_open(os.getpid()))
    except OSError as error:
        raise ValueError('Linux pidfd support is required for scoped process cleanup.') from error
    for tool in ('bash', 'git', 'uv', 'node', 'npm', 'npx', 'docker', 'curl', 'tar', 'sha256sum'):
        if not shutil.which(tool):
            raise ValueError('Required local tool missing: ' + tool)
    if subprocess.check_output(['node', '--version'], text=True).strip() != 'v22.23.4':
        raise ValueError('Use Node 22.23.4 for exact CI parity.')
    if not subprocess.check_output(['uv', '--version'], text=True).startswith('uv 0.12.19'):
        raise ValueError('Use uv 0.12.19 for exact CI parity.')
    subprocess.run(['docker', 'info'], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(['docker', 'compose', 'version'], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', choices=['dev', 'main'], required=True)
    parser.add_argument('--head', required=True, help='Same-repository PR head branch; main accepts only dev.')
    parser.add_argument('--port', type=int, default=18765)
    parser.add_argument('--plan', action='store_true', help='Print commands without running or creating evidence.')
    parser.add_argument('--report', type=Path, help='New report directory outside this checkout.')
    args = parser.parse_args()
    branch_policy(args.base, args.head)
    if not 1024 <= args.port <= 65535:
        raise ValueError('Port must be between 1024 and 65535.')
    if args.plan:
        print(json.dumps(build_plan(args.report or Path('/tmp/backstory-local-ci-plan'), args.port), indent=2))
        return
    preflight()
    if args.report:
        report = args.report.resolve()
        if report == ROOT or ROOT in report.parents:
            raise ValueError('Keep reports and synthetic data outside the source checkout.')
        report.mkdir(mode=0o700, parents=False, exist_ok=False)
    else:
        report = Path(tempfile.mkdtemp(prefix='backstory-local-ci-'))
    print('Logs and evidence: ' + str(report), flush=True)
    run_suite(ROOT, report, args.port)


if __name__ == '__main__':
    main()
