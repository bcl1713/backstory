"""Synthetic stock-Firefox regression probe; never reads real wiki content."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import urllib.request

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

ROOT = Path(__file__).resolve().parents[3]
RUNTIME = Path(os.environ['BACKSTORY_BROWSER_RUNTIME'])
ORIGIN = 'http://127.0.0.1:' + os.environ['BACKSTORY_BROWSER_PORT']
DECISION = '''flowchart TD
A[Initial demonstration and external archive] --> B{First checkpoint complete}
B -->|No| H[Pause and resolve the test condition]
B -->|Yes| C[Apply the first sample change and restart]
C --> D{All sample checks complete}
D -->|No| R[Stop and inspect the synthetic recovery point]
D -->|Yes| E[Save the verified sample checkpoint]
E --> J{Reviewer confirms next stage and checks pass}
J -->|Not now| K[Keep the intermediate sample]
J -->|Yes| F[Apply the second sample change and restart]
F --> G{All sample checks complete}
G -->|No| R
G -->|Yes| I[Resume sample tasks and retain the archive]'''
FIXTURES = [('mermaid', DECISION, 'Mermaid flowchart.'),
            ('graphviz', 'digraph { a -> b; b -> c; a -> c; }', 'Graphviz diagram.'),
            ('vega-lite', json.dumps({'data': {'values': [{'category': 'A', 'value': 2}, {'category': 'B', 'value': 4}]}, 'mark': 'bar', 'encoding': {'x': {'field': 'category', 'type': 'nominal'}, 'y': {'field': 'value', 'type': 'quantitative'}}}), 'Vega-Lite chart.')]
RUNTIME.mkdir(parents=True, exist_ok=True)
REPORTS = RUNTIME / 'reports'
REPORTS.mkdir(exist_ok=True)
options = webdriver.FirefoxOptions()
options.binary_location = os.environ['STOCK_FIREFOX_BINARY']
options.add_argument('-headless')
options.enable_bidi = True
service = Service(os.environ['GECKODRIVER_BINARY'], log_output=str(REPORTS / 'geckodriver.log'))
driver = None
server_log = (REPORTS / 'server.log').open('w')
server = subprocess.Popen(['node', 'tests/browser/support/server.js'], cwd=ROOT,
                          stdout=server_log, stderr=subprocess.STDOUT, start_new_session=True)
try:
    deadline = time.monotonic() + 60
    while True:
        try:
            with urllib.request.urlopen(ORIGIN + '/accounts/login/', timeout=2) as response:
                if response.status == 200:
                    break
        except OSError:
            if server.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError('synthetic server did not start') from None
            time.sleep(.1)
    for engine, source, _ in FIXTURES:
        (RUNTIME / 'wiki' / f'Stock-{engine}.md').write_text(f'Before\n\n```{engine}\n{source}\n```\n\nAfter\n')
    results = []
    failures = []
    # Synthetic rendering probes, not assumptions about the reporter's settings.
    # The scale preferences exercise browser device-pixel geometry; they are not
    # CSS zoom or a claim to reproduce the user's page-zoom setting.
    profiles = [('default', {}, [390, 1180, 2000]),
                ('scale125', {'layout.css.devPixelsPerPx': '1.25'}, [1180]),
                ('scale150', {'layout.css.devPixelsPerPx': '1.5'}, [1180, 2000]),
                ('scale200', {'layout.css.devPixelsPerPx': '2.0'}, [1180]),
                ('document-fonts-off', {'browser.display.use_document_fonts': 0}, [1180])]
    diagnostics = (ROOT / 'tests/browser/support/mermaid-diagnostics.js').read_text()
    diagnostics = diagnostics.replace('export function ', 'function ', 1)
    for profile, preferences, widths in profiles:
        options = webdriver.FirefoxOptions()
        options.binary_location = os.environ['STOCK_FIREFOX_BINARY']
        options.add_argument('-headless')
        options.enable_bidi = True
        for key, value in preferences.items():
            options.set_preference(key, value)
        service = Service(os.environ['GECKODRIVER_BINARY'], log_output=str(REPORTS / f'geckodriver-{profile}.log'))
        driver = webdriver.Firefox(service=service, options=options)
        version = driver.capabilities['browserVersion']
        assert version == '155.0.1', version
        driver.script.add_preload_script(function_declaration="""()=>{
          window.rendererStages=[];
          const record=v=>{if(window.rendererStages.length<16)window.rendererStages.push(v);};
          addEventListener('securitypolicyviolation',e=>record({csp:e.violatedDirective}));
          addEventListener('message',e=>record({type:e.data?.type,opaque:e.origin==='null'}));
          const descriptor=Object.getOwnPropertyDescriptor(MessagePort.prototype,'onmessage');
          Object.defineProperty(MessagePort.prototype,'onmessage',{...descriptor,set(handler){descriptor.set.call(this,handler&&function(e){record({port:e.data?.type,status:e.data?.status,stage:e.data?.stage});return handler.call(this,e);});}});
        }""")
        # This helper records bounded schema/coordinates only for synthetic CI
        # fixtures. It is never installed in the application or a live wiki.
        driver.script.add_preload_script(function_declaration="()=>{window.svgDiagnostics=[];addEventListener('message',e=>{if(e.data?.type==='synthetic-svg-schema'&&window.svgDiagnostics.length<8)window.svgDiagnostics.push(e.data.schema);});window.recordMermaidDiagnostic=v=>{if(window!==top)top.postMessage({type:'synthetic-svg-schema',schema:v},'*');};" + diagnostics + ';installMermaidDiagnostics();}')
        driver.set_window_size(1180, 1000)
        driver.get(ORIGIN + '/accounts/login/')
        driver.find_element(By.NAME, 'username').send_keys('slice')
        driver.find_element(By.NAME, 'password').send_keys('synthetic-slice-browser-only')
        driver.find_element(By.CSS_SELECTOR, 'button[type=submit]').click()
        WebDriverWait(driver, 10).until(lambda d: '/accounts/login/' not in d.current_url)
        for width in widths:
            driver.set_window_size(width, 1000)
            for css_zoom in [1, .9, .8, .7]:
                # WebDriver content key events cannot operate Firefox chrome
                # zoom. Exercise explicitly labeled CSS effective zoom instead;
                # do not enable privileged browser/system access to emulate it.
                zoom_script = driver.script.add_preload_script(function_declaration='()=>{' +
                    f'const zoom={json.dumps(str(css_zoom))};' +
                    'const apply=()=>{if(!document.documentElement)return false;document.documentElement.style.zoom=zoom;return true;};' +
                    'if(!apply()){const observer=new MutationObserver(()=>{if(apply())observer.disconnect();});observer.observe(document,{childList:true});}}')
                fixtures = FIXTURES if profile == 'default' and width == 1180 and css_zoom == 1 else FIXTURES[:1]
                for engine, _, ready in fixtures:
                    driver.get(ORIGIN + f'/notes/Stock-{engine}.md')
                    WebDriverWait(driver, 20).until(lambda d: d.execute_script("return /flowchart\\.|diagram\\.|chart\\.|unavailable|Unsupported/.test(document.querySelector('.lp-diagram-status')?.textContent||'')"))
                    row = driver.execute_script("return {status:document.querySelector('.lp-diagram-status').textContent,stages:window.rendererStages,viewport:innerWidth,scale:devicePixelRatio,css_zoom:getComputedStyle(document.documentElement).zoom}")
                    assert abs(float(row['css_zoom']) - css_zoom) < .001, 'CSS zoom was not applied'
                    row.update(browser=version, engine=engine, profile=profile, window_width=width, requested_css_zoom=css_zoom, browser_page_zoom='default-unmodified')
                    print(json.dumps(row), flush=True)
                    results.append(row)
                    (REPORTS / 'stock-firefox.json').write_text(json.dumps(results, indent=2))
                    driver.save_screenshot(str(REPORTS / f'{engine}-{profile}-{width}-css{css_zoom}-stock-firefox.png'))
                    frame = driver.find_elements(By.CSS_SELECTOR, '.lp-diagram iframe')
                    schema = driver.execute_script('return window.svgDiagnostics || []')
                    (REPORTS / f'{engine}-{profile}-{width}-css{css_zoom}-schema.json').write_text(json.dumps(schema, indent=2))
                    if row['status'] != ready:
                        failures.append(row)
                    if frame:
                        assert frame[0].get_attribute('sandbox') == 'allow-scripts'
                driver.script.remove_preload_script(zoom_script)
        driver.quit()
        driver = None
        service.stop()
    assert not failures, failures
    print(f'{len(results)} stock Firefox 155.0.1 renderer cases passed', flush=True)

finally:
    original_failure = sys.exc_info()[0] is not None
    cleanup_errors = []

    def stop_server():
        try:
            os.killpg(server.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(server.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            server.wait(timeout=5)

    actions = ([driver.quit] if driver is not None else []) + [service.stop, stop_server, server_log.close]
    for action in actions:
        try:
            action()
        except Exception as error:
            cleanup_errors.append(error)
    if cleanup_errors and not original_failure:
        raise RuntimeError('stock Firefox probe cleanup failed') from cleanup_errors[0]
