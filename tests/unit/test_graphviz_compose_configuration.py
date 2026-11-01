"""Canonical manifests transport this opt-in; they must never enable it by default."""
from pathlib import Path
import pytest
import yaml

ROOT = Path(__file__).parents[2]
NAME = 'BACKSTORY_GRAPHVIZ_PARENT_ORIGIN'


@pytest.mark.parametrize('manifest', ['compose.yaml', 'compose.portainer.yaml', 'compose.cloudflare.yaml'])
def test_standalone_manifests_pass_through_only_an_explicit_renderer_origin(manifest):
    source = yaml.safe_load((ROOT / manifest).read_text())
    assert source['services']['web']['environment'].get(NAME) == '${' + NAME + ':-}'
    assert not source.get('include') and not source['services']['web'].get('extends')
    assert all(NAME not in service.get('environment', {}) for key, service in source['services'].items() if key != 'web')


@pytest.mark.parametrize('example', ['.env.example', 'portainer.env.example', 'cloudflare.env.example'])
def test_supplied_environment_examples_leave_graphviz_disabled(example):
    entries = [line for line in (ROOT / example).read_text().splitlines() if line.startswith(NAME + '=')]
    assert entries == [NAME + '=']


def test_host_data_overlay_inherits_the_base_renderer_origin_without_its_own_default():
    source = yaml.safe_load((ROOT / 'compose.host-data.yaml').read_text())
    assert NAME not in source['services']['web']['environment']
