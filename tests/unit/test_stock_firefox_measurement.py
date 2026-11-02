import pytest

from tests.browser.support.stock_firefox_measurement import renderer_css_zoom


class ProbeDriver:
    def __init__(self, fail=False):
        self.context = "parent"
        self.fail = fail
        self.switch_to = self
        self.stale_message_values = [1, .8]

    def frame(self, frame):
        self.context = frame

    def default_content(self):
        self.context = "parent"

    def execute_script(self, script):
        assert script == "return getComputedStyle(document.documentElement).zoom"
        assert self.context == "active-renderer"
        if self.fail:
            raise RuntimeError("measurement failed")
        return "0.7"


def test_measures_active_renderer_instead_of_stale_frame_messages():
    driver = ProbeDriver()
    assert renderer_css_zoom(driver, "active-renderer") == .7
    assert driver.context == "parent"


def test_restores_parent_context_when_measurement_fails():
    driver = ProbeDriver(fail=True)
    with pytest.raises(RuntimeError, match="measurement failed"):
        renderer_css_zoom(driver, "active-renderer")
    assert driver.context == "parent"
