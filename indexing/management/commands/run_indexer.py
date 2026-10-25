import os
import signal
import time
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connections
from indexing.schema import enable_wal
from indexing.worker import run_batch


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
        while not stopping:
            result = run_batch()
            if options['once']:
                return
            # Interruptible bounded sleep keeps SIGTERM responsive.
            delay = max(1, settings.BACKSTORY_INDEX_YIELD_SECONDS)
            until = time.monotonic() + delay
            while not stopping and time.monotonic() < until:
                time.sleep(min(.1, max(0, until - time.monotonic())))
        connections.close_all()
