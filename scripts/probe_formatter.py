#!/usr/bin/env python3
"""Reproduce formatter timing with generated notes only. Never reads a wiki."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from wiki.format_diagnostics import Progress

HEADER = '---\ntitle: Synthetic investigation\ntags: [synthetic, timing]\n---\n\n# Synthetic\n\n'
UNITS = {
    'prose': 'A synthetic paragraph with ordinary words and [a link](example.md). More ordinary words.\n\n',
    'lists': '- A synthetic item with [[Example|Example label]] and [a link](other.md).\n',
    'structure': '## Section\n\n> Synthetic quotation.\n\n- First\n- Second\n\n| One | Two |\n| --- | --- |\n| a | b |\n\n',
}


def request(shape, size):
    unit = UNITS[shape]
    source = HEADER + unit * max(1, (size - len(HEADER)) // len(unit))
    return dict(path='synthetic.md', source=source, files={})


def cold(node, shape, size):
    payload = request(shape, size)
    start = time.monotonic()
    child = subprocess.run([node, str(ROOT / 'formatter/main.mjs')],
                           input=json.dumps(payload), capture_output=True, text=True,
                           timeout=13, cwd=ROOT)
    result = json.loads(child.stdout)
    progress = Progress()
    progress.feed(child.stderr.encode())
    return dict(mode='cold', shape=shape, source_bytes=len(payload['source'].encode()),
                elapsed_ms=round((time.monotonic() - start) * 1000),
                outcome=result['outcome'], trace=progress.trace)


# A separate process imports the same packaged pipeline once. Its first call
# and byte-identical retries distinguish module initialization from warm work;
# this is a measurement path, never a production worker reuse change.
WARM = '''
const started = performance.now();
const {formatRequest} = await import('./formatter/pipeline.mjs');
const import_ms = Math.ceil(performance.now()-started);
let input=''; for await(const chunk of process.stdin) input+=chunk;
const {request,retries}=JSON.parse(input), rows=[];
for(let retry=0;retry<retries;retry++) {
  const start=performance.now(),trace=[];
  const result=await formatRequest(request,{reportStage:stage=>trace.push({stage,elapsed_ms:Math.ceil(performance.now()-start)})});
  rows.push({mode:'warm',retry,import_ms,source_bytes:Buffer.byteLength(request.source),elapsed_ms:Math.ceil(performance.now()-start),outcome:result.outcome,trace});
}
process.stdout.write(JSON.stringify(rows));
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, required=True, help='New JSON evidence file outside the checkout.')
    parser.add_argument('--retries', type=int, default=2, choices=range(1, 6))
    args = parser.parse_args()
    report = args.report.resolve()
    if report == ROOT or ROOT in report.parents or report.exists():
        parser.error('Use a new evidence file outside the source checkout.')
    node = shutil.which('node')
    if not node:
        parser.error('Node is required.')
    identity = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    dirty = bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).strip())
    evidence = dict(source_sha=identity, dirty=dirty,
                    node=subprocess.check_output([node, '--version'], text=True).strip(), rows=[])
    for shape in UNITS:
        for size in (1000, 4000, 16000, 64000):
            for retry in range(args.retries):
                row = cold(node, shape, size)
                row['retry'] = retry
                evidence['rows'].append(row)
                print(json.dumps({k: v for k, v in row.items() if k != 'trace'}), flush=True)
        child = subprocess.run([node, '--input-type=module', '-e', WARM], cwd=ROOT,
                               input=json.dumps(dict(request=request(shape, 4000), retries=args.retries)),
                               capture_output=True, text=True, check=True, timeout=30)
        for row in json.loads(child.stdout):
            row['shape'] = shape
            evidence['rows'].append(row)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(lambda _: cold(node, 'lists', 4000), range(8)):
            row['concurrency'] = 4
            evidence['rows'].append(row)
    with report.open('x') as stream:
        json.dump(evidence, stream, indent=2)
        stream.write('\n')
    print('Evidence: ' + str(report))


if __name__ == '__main__':
    main()
