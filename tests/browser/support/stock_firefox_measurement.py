"""Measurements for the synthetic stock-Firefox browser probe."""


def renderer_css_zoom(driver, frame):
    """Read the active renderer and always restore the parent browsing context."""
    try:
        driver.switch_to.frame(frame)
        return float(driver.execute_script(
            "return getComputedStyle(document.documentElement).zoom"))
    finally:
        driver.switch_to.default_content()
