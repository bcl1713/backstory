"""Every standalone manifest must pass the wiki zone into the web process."""
from pathlib import Path
import pytest
import yaml

TEMPLATES = ('compose.yaml', 'compose.portainer.yaml', 'compose.cloudflare.yaml')
ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize('template', TEMPLATES)
def test_wiki_timezone_mapping_exists_in_each_standalone_template(template):
    deployment = yaml.safe_load((ROOT / template).read_text())
    assert deployment['services']['web']['environment'].get('BACKSTORY_WIKI_TIMEZONE') == '${BACKSTORY_WIKI_TIMEZONE:-}'


@pytest.mark.parametrize('template', TEMPLATES)
@pytest.mark.parametrize('zone', ['America/Chicago', ''])
def test_wiki_timezone_reaches_rendered_web_environment(tmp_path, template, zone):
    if template == 'compose.cloudflare.yaml':
        from tests.integration.test_cloudflare_packaging import config, rendered
        environment = rendered(config(tmp_path, BACKSTORY_WIKI_TIMEZONE=zone))['services']['web']['environment']
    else:
        from tests.integration.test_compose_env import config, web_config
        environment = web_config(config(tmp_path, files=template, BACKSTORY_IMAGE='backstory:fixture',
            BACKSTORY_DATA_HOST_PATH=str(tmp_path / 'private-data'), BACKSTORY_WIKI_TIMEZONE=zone))['environment']
    assert environment['BACKSTORY_WIKI_TIMEZONE'] == zone
