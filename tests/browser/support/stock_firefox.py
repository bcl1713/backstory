"""Synthetic stock-Firefox regression probe; never reads real wiki content."""
import json
import os
from pathlib import Path
import signal
import subprocess
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
    driver = webdriver.Firefox(service=service, options=options)
    version = driver.capabilities['browserVersion']
    assert version == '155.0.1', version
    driver.script.add_preload_script(function_declaration='''()=>{
      window.rendererStages=[];
      const record=v=>window.rendererStages.push(v);
      addEventListener('securitypolicyviolation',e=>record({csp:e.violatedDirective}));
      addEventListener('message',e=>record({type:e.data?.type,opaque:e.origin==='null'}));
      const descriptor=Object.getOwnPropertyDescriptor(MessagePort.prototype,'onmessage');
      Object.defineProperty(MessagePort.prototype,'onmessage',{...descriptor,set(handler){descriptor.set.call(this,handler&&function(e){record({port:e.data?.type,status:e.data?.status});return handler.call(this,e);});}});
    }''')
    driver.set_window_size(1180, 1000)
    driver.get(ORIGIN + '/accounts/login/')
    driver.find_element(By.NAME, 'username').send_keys('slice')
    driver.find_element(By.NAME, 'password').send_keys('synthetic-slice-browser-only')
    driver.find_element(By.CSS_SELECTOR, 'button[type=submit]').click()
    WebDriverWait(driver, 10).until(lambda d: '/accounts/login/' not in d.current_url)
    results = []
    for engine, _, ready in FIXTURES:
        driver.get(ORIGIN + f'/notes/Stock-{engine}.md')
        WebDriverWait(driver, 20).until(lambda d: d.execute_script("return /flowchart\\.|diagram\\.|chart\\.|unavailable|Unsupported/.test(document.querySelector('.lp-diagram-status')?.textContent||'')"))
        row = driver.execute_script("return {status:document.querySelector('.lp-diagram-status').textContent,stages:window.rendererStages}")
        row.update(browser=version, engine=engine)
        print(json.dumps(row), flush=True)
        results.append(row)
        (REPORTS / 'stock-firefox.json').write_text(json.dumps(results, indent=2))
        driver.save_screenshot(str(REPORTS / f'{engine}-stock-firefox.png'))
        assert row['status'] == ready, row
        frame = driver.find_element(By.CSS_SELECTOR, '.lp-diagram iframe')
        assert frame.get_attribute('sandbox') == 'allow-scripts'
    print('3 stock Firefox 155.0.1 renderer cases passed', flush=True)
finally:
    if driver is not None:
        driver.quit()
    service.stop()
    os.killpg(server.pid, signal.SIGTERM)
    try:
        server.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(server.pid, signal.SIGKILL)
        server.wait(timeout=5)
    server_log.close()
