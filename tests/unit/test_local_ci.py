"""Local correctness keeps every gate and never grants itself publication."""
import importlib.util
import json
from pathlib import Path
import re

import pytest

ROOT = Path(__file__).resolve().parents[2]


def module():
    spec = importlib.util.spec_from_file_location('local_ci', ROOT / 'scripts/local_ci.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def test_no_active_hosted_workflows_remain():
    assert not list((ROOT / '.github/workflows').glob('*.y*ml'))


def test_browser_specs_do_not_share_fixed_runtime_or_artifact_paths():
    for path in (ROOT / 'tests/browser').glob('*.spec.js'):
        assert '/tmp/backstory-release-one' not in path.read_text(), str(path)


def test_plan_keeps_all_browser_and_container_gates(tmp_path):
    plan = module().build_plan(tmp_path, 18765)
    assert [step['name'] for step in plan] == [
        'dependencies', 'build', 'python', 'formatter', 'browser-install',
        'chromium', 'firefox-code', 'firefox-renderers', 'stock-firefox-install',
        'stock-firefox', 'container']
    commands = '\n'.join(step['command'] for step in plan)
    for expected in ['uv sync --frozen', 'npm ci', 'npm run build',
                     'pytest -n 2 --dist loadfile', 'npm run test:formatter',
                     'npm run test:browser', 'playwright.code.config.js',
                     'playwright.firefox.config.js', 'selenium==4.52.0',
                     'stock_firefox.py', 'docker build', 'check --deploy --fail-level WARNING',
                     'run --pull never --rm web', 'down --volumes']:
        assert expected in commands
    assert 'docker push' not in commands
    assert 'gh release' not in commands
    assert '${{ ' not in commands
    assert len({step['env']['BACKSTORY_BROWSER_RUNTIME'] for step in plan
                if 'BACKSTORY_BROWSER_RUNTIME' in step['env']}) == 4


def test_receipt_rejects_incomplete_failed_and_wrong_source(tmp_path):
    m = module()
    good = {'schema': 1, 'source_sha': 'a' * 40, 'source_tree': 'b' * 40,
            'gates': {step['name']: 'passed' for step in m.build_plan(tmp_path, 18765)}}
    assert m.validate_receipt(good, 'a' * 40, 'b' * 40) is None
    for wrong in [dict(good, source_sha='c' * 40), dict(good, source_tree='c' * 40),
                  dict(good, gates={}), dict(good, gates={**good['gates'], 'container': 'failed'})]:
        with pytest.raises(ValueError):
            m.validate_receipt(wrong, 'a' * 40, 'b' * 40)


def test_main_promotion_remains_dev_only():
    m = module()
    m.branch_policy('main', 'dev')
    m.branch_policy('dev', 'feature/test')
    with pytest.raises(ValueError):
        m.branch_policy('main', 'feature/test')


def test_steps_ignore_test_selection_and_unique_projects_do_not_use_report_basename(tmp_path, monkeypatch):
    m = module()
    monkeypatch.setenv('PYTEST_ADDOPTS', '-k tiny --ignore tests/integration')
    monkeypatch.setenv('PYTEST_PLUGINS', 'skip_everything')
    monkeypatch.setenv('PYTHONOPTIMIZE', '1')
    calls = []
    monkeypatch.setattr(m, 'run_process', lambda *args, **kwargs: calls.append(kwargs))
    for name in ('one', 'two'):
        report = tmp_path / name / 'same-name'
        report.mkdir(parents=True)
        m.run_step(dict(name='example', command=':', env={}), ROOT, report)
    first, second = (call['env'] for call in calls)
    assert 'PYTEST_ADDOPTS' not in first and 'PYTEST_PLUGINS' not in first
    assert 'PYTHONOPTIMIZE' not in first
    assert first['LOCAL_RUN_ID'] != second['LOCAL_RUN_ID']
    assert re.fullmatch('[0-9a-f]{32}', first['LOCAL_RUN_ID'])


def test_runner_stops_without_success_receipt_after_failure(tmp_path, monkeypatch):
    m = module()
    calls = []
    def fail(step, root, report):
        calls.append(step['name'])
        if step['name'] == 'python':
            raise RuntimeError('test failure')
    monkeypatch.setattr(m, 'run_step', fail)
    monkeypatch.setattr(m, 'source_identity', lambda root: ('a' * 40, 'b' * 40))
    with pytest.raises(RuntimeError):
        m.run_suite(ROOT, tmp_path, 18765)
    assert calls == ['dependencies', 'build', 'python']
    assert not (tmp_path / 'receipt.json').exists()
    assert json.loads((tmp_path / 'status.json').read_text())['gates']['python'] == 'failed'


def test_timeout_stops_the_entire_process_group(tmp_path):
    import subprocess
    m = module()
    child_pid = tmp_path / 'child.pid'
    with pytest.raises(subprocess.TimeoutExpired):
        m.run_process(['bash', '-c', 'sleep 30 & echo $! > "$1"; wait', '--', str(child_pid)], timeout=0.2)
    pid = int(child_pid.read_text())
    process_state = Path('/proc') / str(pid) / 'stat'
    # A killed orphan can briefly be a zombie until the executor's init reaps it.
    assert not process_state.exists() or process_state.read_text().split()[2] == 'Z'


def test_failed_container_step_still_cleans_only_its_unique_project(tmp_path, monkeypatch):
    m = module()
    fixture = tmp_path / 'container-fixture'
    fixture.mkdir()
    (fixture / 'fixture.env').write_text('BACKSTORY_DATA_PATH=/synthetic\n')
    calls = []
    def run(args, **kwargs):
        calls.append((args, kwargs))
        if len(calls) == 1:
            raise RuntimeError('interrupted container gate')
    monkeypatch.setattr(m, 'run_process', run)
    with pytest.raises(RuntimeError, match='interrupted'):
        m.run_step(dict(name='container', command=':', env={}), ROOT, tmp_path)
    assert len(calls) == 2
    command, kwargs = calls[-1]
    assert command == ['docker', 'compose', '--env-file', str(fixture / 'fixture.env'),
                       '-f', 'compose.yaml', 'down', '--volumes']
    assert kwargs['env']['COMPOSE_PROJECT_NAME'].startswith('backstory-ci-')
    assert kwargs['env']['COMPOSE_PROJECT_NAME'] == calls[0][1]['env']['COMPOSE_PROJECT_NAME']


def test_timeout_stops_detached_descendants_and_allows_cleanup_grace(tmp_path):
    import subprocess
    import sys
    m = module()
    pid_file = tmp_path / 'detached.pid'
    marker = tmp_path / 'cleanup-finished'
    detached = '''import os, pathlib, signal, time
pathlib.Path(%r).write_text(str(os.getpid()))
def stop(signum, frame):
    time.sleep(0.3)
    pathlib.Path(%r).write_text('cleaned')
    raise SystemExit(0)
signal.signal(signal.SIGTERM, stop)
time.sleep(30)
''' % (str(pid_file), str(marker))
    launcher = 'import subprocess,sys,time; subprocess.Popen([sys.executable,"-c",%r],start_new_session=True); time.sleep(30)' % detached
    try:
        with pytest.raises(subprocess.TimeoutExpired):
            m.run_process([sys.executable, '-c', launcher], timeout=0.4)
        assert marker.read_text() == 'cleaned'
        state = Path('/proc') / pid_file.read_text() / 'stat'
        assert not state.exists() or state.read_text().split()[2] == 'Z'
    finally:
        # Keep a deliberately failing pre-fix regression from leaking its probe.
        if pid_file.exists():
            import os
            import signal
            try:
                os.kill(int(pid_file.read_text()), signal.SIGKILL)
            except ProcessLookupError:
                pass
