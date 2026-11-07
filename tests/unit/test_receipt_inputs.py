"""Runtime provenance is mandatory and changes invalidate same-source evidence."""
import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


def module():
    spec = importlib.util.spec_from_file_location('receipt_inputs_ci', ROOT / 'scripts/local_ci.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def test_receipt_rejects_missing_or_changed_runtime_inputs(monkeypatch, tmp_path):
    m = module()
    monkeypatch.setattr(m, 'runtime_inputs', lambda root: {'node': '22.23.4'})
    receipt = dict(schema=m.RECEIPT_SCHEMA, source_sha='a' * 40, source_tree='b' * 40,
                   gates={s['name']: 'passed' for s in m.build_plan(tmp_path, 18765)})
    with pytest.raises(ValueError, match='inputs'):
        m.validate_receipt(receipt, 'a' * 40, 'b' * 40)
    receipt['inputs'] = {'node': '22.23.4'}
    m.validate_receipt(receipt, 'a' * 40, 'b' * 40)
    receipt['inputs']['node'] = 'old'
    with pytest.raises(ValueError, match='inputs'):
        m.validate_receipt(receipt, 'a' * 40, 'b' * 40)


def test_runtime_provenance_hashes_configuration_without_recording_secrets(monkeypatch, tmp_path):
    m = module()
    configuration = tmp_path / 'fonts.conf'
    configuration.write_text('first configuration')
    monkeypatch.setenv('FONTCONFIG_FILE', str(configuration))
    monkeypatch.setenv('GH_TOKEN', 'never-record-this')
    monkeypatch.setattr(m, 'tool_identity', lambda args, **kwargs: (str(configuration) if args[0] == 'fc-match' else '{}' if args[:2] == ['npm', 'ls'] else 'pinned'))
    monkeypatch.setattr(m, 'browser_identity', lambda root: 'browser-digest')
    first = m.runtime_inputs(tmp_path)
    assert 'never-record-this' not in str(first)
    configuration.write_text('changed configuration')
    assert m.runtime_inputs(tmp_path) != first


def test_gate_captures_inputs_before_tests_and_refuses_midrun_change(tmp_path, monkeypatch):
    m = module()
    events = []
    monkeypatch.setattr(m, 'source_identity', lambda root: ('a' * 40, 'b' * 40))
    monkeypatch.setattr(m, 'build_plan', lambda report, port: [dict(name=name) for name in
        ('dependencies', 'browser-install', 'python')])
    monkeypatch.setattr(m, 'run_step', lambda step, root, report: events.append(step['name']))
    def inputs(root):
        events.append('inputs')
        return {'runtime': 'changed' if 'python' in events else 'initial'}
    monkeypatch.setattr(m, 'runtime_inputs', inputs)
    with pytest.raises(ValueError, match='inputs'):
        m.run_suite(ROOT, tmp_path, 18765)
    assert events[:4] == ['dependencies', 'browser-install', 'inputs', 'python']
    assert not (tmp_path / 'receipt.json').exists()


@pytest.mark.parametrize('changed', ['python', 'npm'])
def test_installed_dependency_changes_invalidate_same_source_receipt(monkeypatch, tmp_path, changed):
    m = module()
    state = {'python': 'Django==5.2.18\npytest==9.1.1',
             'npm': '{"name":"backstory","dependencies":{"example":{"version":"1.0.0"}}}'}
    font = tmp_path / 'font.ttf'
    font.write_text('font')
    def tools(args, **kwargs):
        if args[:3] == ['uv', 'pip', 'freeze']:
            assert '--no-cache' in args
            assert args[args.index('--python') + 1] == str(tmp_path / '.venv/bin/python')
            return state['python']
        if args[:3] == ['npm', 'ls', '--all']:
            assert kwargs['cwd'] == tmp_path
            return state['npm']
        return str(font) if args[0] == 'fc-match' else 'pinned'
    monkeypatch.setattr(m, 'tool_identity', tools)
    monkeypatch.setattr(m, 'browser_identity', lambda root: 'browser')
    inputs = m.runtime_inputs(tmp_path)
    assert len(inputs['python_packages_sha256']) == 64
    assert len(inputs['npm_packages_sha256']) == 64
    receipt = dict(schema=m.RECEIPT_SCHEMA, source_sha='a' * 40, source_tree='b' * 40,
        gates={s['name']: 'passed' for s in m.build_plan(tmp_path, 18765)}, inputs=inputs)
    m.validate_receipt(receipt, 'a' * 40, 'b' * 40, root=tmp_path)
    state[changed] = ('Django==5.2.19\npytest==9.1.1' if changed == 'python' else
        '{"name":"backstory","dependencies":{"example":{"version":"1.0.1"}}}')
    with pytest.raises(ValueError, match='inputs'):
        m.validate_receipt(receipt, 'a' * 40, 'b' * 40, root=tmp_path)


def test_dependency_fingerprints_normalize_order_and_record_only_digests(monkeypatch, tmp_path):
    m = module()
    state = {'python': 'b==2\na==1\n',
             'npm': '{"path":"/private/path","token":"secret-value","dependencies":{"b":{"version":"2"},"a":{"version":"1"}}}'}
    def tools(args, **kwargs):
        return state['python' if args[0] == 'uv' else 'npm']
    monkeypatch.setattr(m, 'tool_identity', tools)
    first = m.dependency_inputs(tmp_path)
    state['python'] = 'a==1\nb==2'
    state['npm'] = '{"dependencies":{"a":{"version":"1"},"b":{"version":"2"}},"token":"secret-value","path":"/private/path"}'
    assert m.dependency_inputs(tmp_path) == first
    assert '/private/path' not in str(first) and 'secret-value' not in str(first)
