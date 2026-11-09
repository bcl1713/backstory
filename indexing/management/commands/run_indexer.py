import os
import signal
import time
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connections
from indexing.schema import enable_wal
from indexing.scanner import clear_cursors
from indexing.watcher import WatchService
from indexing.worker import run_batch
from wiki.move_previews import run_pending_move_preview


def batch_delay(result, elapsed):
    """Cheap metadata proceeds promptly; expensive work yields under load."""
    if not result.pending or result.state in {'backoff', 'leased'}:
        return settings.BACKSTORY_INDEX_YIELD_SECONDS
    # Hard note/time budgets live in run_batch. Recheck foreground jobs and
    # notifications after each short quantum, without fixed per-20-item sleeps.
    return min(.1, max(.005, elapsed * .1))


class Command(BaseCommand):
    help = 'Run the single durable bounded index worker and scheduler.'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true')

    def handle(self, *args, **options):
        stopping = False
        def stop(signum, frame):
            nonlocal stopping
            stopping = True
        signal.signal(signal.SIGTERM, stop)
        signal.signal(signal.SIGINT, stop)
        try:
            os.nice(10)
        except OSError:
            pass
        enable_wal()
        try:
            with WatchService() as watcher:
                while not stopping:
                    watcher.poll()
                    started = time.monotonic()
                    result = run_batch()
                    run_pending_move_preview()
                    if options['once']:
                        return
                    until = time.monotonic() + batch_delay(result, time.monotonic() - started)
                    while not stopping and time.monotonic() < until:
                        watcher.wait(min(.1, max(0, until - time.monotonic())))
                        watcher.poll()
                        # Both native events and web saves wake within .1s;
                        # waiting jobs are checked even on polling-only mounts.
                        from indexing.models import IndexJob
                        if IndexJob.objects.filter(not_before__lte=time.time()).exists():
                            break
        finally:
            clear_cursors()
            connections.close_all()
