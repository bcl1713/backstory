"""Emergency SQL watchdog for bounded graph pages, excluding non-SQL work.

The progress handler remains installed through cursor consumption. Resetting at
each execute excludes filesystem validation, compilation and scratch setup between
statements. Cooperative traversal checkpoints provide the ordinary work bound.
"""
from contextlib import contextmanager
from dataclasses import dataclass
import time

from django.db import connection

SQLITE_VM_STEPS = 2_000_000
SQLITE_SECONDS = 1.0


@dataclass
class QueryBudget:
    triggered: bool = False


@contextmanager
def sqlite_budget():
    connection.ensure_connection()
    database = connection.connection
    budget = QueryBudget()
    deadline, steps = 0, 0
    granularity = min(1000, max(1, SQLITE_VM_STEPS))

    def interrupt():
        nonlocal steps
        steps += granularity
        budget.triggered = steps >= SQLITE_VM_STEPS or time.monotonic() >= deadline
        return int(budget.triggered)

    def start(execute, sql, params, many, context):
        nonlocal deadline, steps
        deadline, steps = time.monotonic() + SQLITE_SECONDS, 0
        return execute(sql, params, many, context)

    database.set_progress_handler(interrupt, granularity)
    try:
        with connection.execute_wrapper(start):
            yield budget
    finally:
        database.set_progress_handler(None, 0)
