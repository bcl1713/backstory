#!/usr/bin/env python3
"""Measure bounded graph queries on new synthetic storage, never a live wiki."""
import argparse
from dataclasses import asdict
import json
import os
from pathlib import Path
import platform
import resource
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def measure(count):
    from tests.fixtures.graph import generate_graph_fixture
    destination = Path(tempfile.mkdtemp(prefix='backstory-graph-benchmark-')) / 'corpus'
    wiki, data = generate_graph_fixture(destination, count)
    os.environ.update(DJANGO_SETTINGS_MODULE='backstory.settings', BACKSTORY_WIKI_ROOT=str(wiki),
                      BACKSTORY_DATA_DIR=str(data), BACKSTORY_IDENTITY_PATH='.backstory-marker',
                      BACKSTORY_COOKIE_MODE='localhost', BACKSTORY_ALLOWED_HOSTS='localhost')
    import django
    django.setup()
    from django.core.management import call_command
    call_command('migrate', verbosity=0)
    from indexing.worker import run_batch
    started = time.perf_counter()
    for batches in range(count * 5 + 100):
        if not run_batch().pending:
            break
    else:
        raise RuntimeError('Synthetic index did not finish its bounded passes')
    indexed_seconds = time.perf_counter() - started
    from indexing.graph import query_graph, query_links, query_link_issues
    from wiki.contracts import StorageError
    operations = [('local', lambda: query_graph('n00000.md')),
                  ('two_hop', lambda: query_graph('n00002.md', depth=2)),
                  ('overview', query_graph),
                  ('links', lambda: query_links('n00003.md', 'incoming')),
                  ('isolated', lambda: query_link_issues(issue='isolated'))]
    results = []
    for name, operation in operations:
        started = time.perf_counter()
        try:
            page = operation()
            payload = json.dumps(asdict(page), ensure_ascii=True).encode()
            result = dict(state=page.state, payload_bytes=len(payload), limits=page.limits,
                          reasons=page.limiting_reasons, continuation=bool(page.next_cursor))
        except StorageError as error:
            result = dict(state='limited', reason_code=error.reason_code)
        elapsed_ms = (time.perf_counter() - started) * 1000
        # Tracemalloc changes the elapsed-time budget itself. Report untraced
        # request timing and the process high-water RSS, including indexing.
        peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
        results.append(dict(name=name, elapsed_ms=round(elapsed_ms, 2), process_peak_rss_bytes=peak, **result))
    return dict(notes=count, index_seconds=round(indexed_seconds, 2), worker_batches=batches + 1, queries=results)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--one', type=int, help=argparse.SUPPRESS)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.one:
        args.output.write_text(json.dumps(measure(args.one)))
        return
    results = []
    for count in (100, 1000, 10000):
        destination = Path(tempfile.mkdtemp(prefix='graph-measure-')) / 'result.json'
        subprocess.run([sys.executable, __file__, '--one', str(count), '--output', str(destination)], check=True)
        results.append(json.loads(destination.read_text()))
        print(f'Measured {count} synthetic notes', flush=True)
    args.output.write_text(json.dumps(dict(environment=dict(python=sys.version, platform=platform.platform(),
        machine=platform.machine(), processor=platform.processor(), cpus=os.cpu_count()), results=results), indent=2) + '\n')


if __name__ == '__main__':
    main()
