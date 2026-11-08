"""Synthetic external invalidations and inexpensive metadata reconciliation."""
import os
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from tests.integration.test_storage import wiki
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


def test_warm_metadata_is_batched_without_bodies_or_dependency_writes(wiki, monkeypatch):
    from indexing import worker
    from indexing.queue import request_scan
    for n in range(1000):
        (wiki / f'n{n}.md').write_text('# Stable' + ('\n[Asset](asset.png)' if n == 0 else ''))
    drain(worker)
    # Operation counts use a controlled clock, independent of host throughput.
    monkeypatch.setattr(worker.time, 'monotonic', lambda: 0)
    monkeypatch.setattr(worker, 'read_note', lambda path: pytest.fail('unchanged body read'))
    monkeypatch.setattr(worker, 'project_note', lambda note: pytest.fail('unchanged parse'))
    from indexing import graph_projection
    monkeypatch.setattr(graph_projection, 'resolve_relation', lambda *a: pytest.fail('unchanged resolve'))
    request_scan('incremental')
    with CaptureQueriesContext(connection) as queries:
        batches = 0
        for n in range(30):
            result = worker.run_batch(now=10000400000 + n * .01)
            batches += 1
            if not result.pending:
                break
    assert not result.pending, 'metadata work still uses content-sized batches'
    note_selects = [q['sql'] for q in queries if q['sql'].startswith('SELECT') and 'indexing_indexednote' in q['sql']]
    assert not any('"body"' in sql for sql in note_selects)
    seen_writes = [q for q in queries if q['sql'].startswith('UPDATE "indexing_indexednote" SET "seen"')]
    assert len(seen_writes) < 20
    assert batches < 20
    assert not any(q['sql'].startswith('UPDATE "indexing_relationpath"') for q in queries)


def test_invalidation_reads_authoritative_content_and_preserves_newer_event(wiki, monkeypatch):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import IndexJob, IndexedNote
    path = wiki / 'note.md'
    path.write_text('# Initial')
    drain(worker)
    path.write_text('# External')
    invalidate_path('note.md', now=0)
    original = worker._commit_projection
    def during_commit(*args):
        original(*args)
        invalidate_path('note.md', now=0)
    monkeypatch.setattr(worker, '_commit_projection', during_commit)
    result = worker.run_batch(now=10000000001)
    assert result.priority == 1
    assert IndexJob.objects.filter(path='note.md').exists()
    assert IndexedNote.objects.get(generation__state='active', path='note.md').title == 'External'
    monkeypatch.setattr(worker, '_commit_projection', original)
    drain(worker)
    assert not IndexJob.objects.exists()


def test_debounce_has_maximum_wait_and_queue_overflow_is_durable(wiki, settings):
    from indexing.queue import invalidate_path
    from indexing.models import IndexJob, ScanState
    settings.BACKSTORY_INDEX_DEBOUNCE_SECONDS = .25
    settings.BACKSTORY_INDEX_DEBOUNCE_MAX_SECONDS = 1
    settings.BACKSTORY_INDEX_QUEUE_LIMIT = 1
    for n in range(20):
        invalidate_path('note.md', now=n * .1)
    assert IndexJob.objects.get().not_before <= 1
    invalidate_path('another.md', now=2)
    assert IndexJob.objects.count() == 1
    assert ScanState.objects.get(pk=1).reconcile_needed


def test_non_note_invalidation_refreshes_negative_exact_dependency(wiki):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import ResolvedRelation
    (wiki / 'source.md').write_text('# Source\n[Asset](asset.png)')
    drain(worker)
    assert ResolvedRelation.objects.get().state == 'missing'
    (wiki / 'asset.png').write_bytes(b'attachment')
    invalidate_path('asset.png', now=0)
    drain(worker)
    assert ResolvedRelation.objects.get().state == 'resolved'


def test_delete_and_atomic_rename_converge_without_whole_vault_read(wiki, monkeypatch):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import IndexedNote
    for name in ['keep', 'old']:
        (wiki / f'{name}.md').write_text('# ' + name)
    drain(worker)
    (wiki / 'old.md').rename(wiki / 'new.md')
    invalidate_path('old.md', now=0)
    invalidate_path('new.md', now=0)
    original = worker.read_note
    def read(path):
        assert path != 'keep.md'
        return original(path)
    monkeypatch.setattr(worker, 'read_note', read)
    drain(worker)
    assert set(IndexedNote.objects.filter(generation__state='active').values_list('path', flat=True)) == {'keep.md', 'new.md'}


def test_invalidation_same_stat_edit_and_alias_collision(wiki):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import ResolvedRelation, IndexedNote
    (wiki / 'source.md').write_text('[[Friendly]]')
    (wiki / 'a.md').write_text('---\naliases: [Friendly]\n---\n# One')
    drain(worker)
    assert ResolvedRelation.objects.get().destination == 'a.md'
    before = (wiki / 'a.md').stat()
    (wiki / 'a.md').write_text('---\naliases: [Friendly]\n---\n# Two')
    os.utime(wiki / 'a.md', ns=(before.st_atime_ns, before.st_mtime_ns))
    invalidate_path('a.md', now=0)
    drain(worker)
    assert IndexedNote.objects.get(generation__state='active', path='a.md').title == 'Two'
    (wiki / 'b.md').write_text('---\naliases: [Friendly]\n---\n# B')
    invalidate_path('b.md', now=0)
    drain(worker)
    assert ResolvedRelation.objects.get().state == 'ambiguous'
    (wiki / 'b.md').unlink()
    invalidate_path('b.md', now=0)
    drain(worker)
    assert ResolvedRelation.objects.get().destination == 'a.md'


def test_unreadable_invalidation_cannot_delete_indexed_note(wiki, monkeypatch):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import IndexedNote, IndexJob
    from wiki.contracts import StorageError
    (wiki / 'keep.md').write_text('# Keep')
    drain(worker)
    invalidate_path('keep.md', now=0)
    from indexing import graph_projection
    monkeypatch.setattr(graph_projection, 'path_fingerprint', lambda path: (_ for _ in ()).throw(StorageError('storage_io_error', 503)))
    assert worker.run_batch(now=10000000001).state == 'backoff'
    assert IndexedNote.objects.filter(generation__state='active', path='keep.md').exists()
    assert IndexJob.objects.filter(path='keep.md').exists()


def test_command_cheap_work_has_no_fixed_per_twenty_delay(settings):
    from indexing.worker import BatchResult
    from indexing.management.commands.run_indexer import batch_delay
    assert sum(batch_delay(BatchResult(pending=True, state='partial'), .01) for _ in range(100)) < 1
    assert batch_delay(BatchResult(), .01) == settings.BACKSTORY_INDEX_YIELD_SECONDS


def test_phase_counters_count_parses_and_sparse_dependency_rows(wiki):
    from indexing import worker
    from indexing.queue import request_scan
    from indexing.models import IndexGeneration, RelationPath, ScanState
    from indexing.graph_projection import namespace_version, verify_path_batch
    (wiki / 'note.md').write_text('# One')
    drain(worker)
    generation = IndexGeneration.objects.get(state='active')
    namespace = namespace_version()
    RelationPath.objects.create(pk=100, generation=generation, path='missing.png', fingerprint='missing', namespace=namespace)
    count = []
    after, complete = verify_path_batch(generation, 0, 256, checked_count=count)
    assert (after, complete, count) == (100, True, [1])
    info = (wiki / 'note.md').stat()
    (wiki / 'note.md').write_text('# Two')
    os.utime(wiki / 'note.md', ns=(info.st_atime_ns, info.st_mtime_ns))
    request_scan('verify')
    worker.run_batch(now=10000000001)
    assert ScanState.objects.get(pk=1).checkpoint['parsed_notes'] == 1
    drain(worker)
    os.utime(wiki / 'note.md', ns=(info.st_atime_ns, info.st_mtime_ns + 1000000))
    request_scan('incremental')
    worker.run_batch(now=10000000001)
    assert ScanState.objects.get(pk=1).checkpoint['parsed_notes'] == 0


def test_missing_event_waits_for_atomic_replacement_before_deletion(wiki):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import IndexedNote, IndexJob
    path = wiki / 'note.md'
    path.write_text('# Original')
    drain(worker)
    path.unlink()
    invalidate_path('note.md', now=10000000001)
    worker.run_batch(now=10000000001.3)
    assert IndexedNote.objects.filter(generation__state='active', path='note.md').exists()
    assert IndexJob.objects.get().not_before == 10000000003.3
    path.write_text('# Replaced')
    worker.run_batch(now=10000000003.3)
    assert IndexedNote.objects.get(generation__state='active', path='note.md').title == 'Replaced'
    assert not IndexJob.objects.exists()


def test_old_coalesced_event_observes_fresh_absence_grace(wiki):
    from indexing import worker
    from indexing.queue import invalidate_path
    from indexing.models import IndexedNote, IndexJob
    path = wiki / 'note.md'
    path.write_text('# Kept during replacement')
    drain(worker)
    invalidate_path('note.md', now=0)
    invalidate_path('note.md', now=100)
    path.unlink()
    worker.run_batch(now=10000000001)
    assert IndexedNote.objects.filter(generation__state='active', path='note.md').exists()
    assert IndexJob.objects.get().missing_since == 10000000001
    assert IndexJob.objects.get().not_before == 10000000003


def test_priority_filled_batch_persists_parse_counters_for_both_job_kinds(wiki, settings):
    from indexing import worker
    from indexing.queue import invalidate_path, enqueue_note, request_scan
    from indexing.models import ScanState
    from wiki.storage import read_note
    (wiki / 'saved.md').write_text('# Before')
    (wiki / 'external.md').write_text('# Before')
    drain(worker)
    settings.BACKSTORY_INDEX_BATCH_SIZE = 1
    request_scan('incremental')
    (wiki / 'saved.md').write_text('# Saved')
    enqueue_note('saved.md', read_note('saved.md').revision)
    assert worker.run_batch(now=10000000001).priority == 1
    assert ScanState.objects.get(pk=1).checkpoint['parsed_notes'] == 1
    (wiki / 'external.md').write_text('# External')
    invalidate_path('external.md', now=0)
    assert worker.run_batch(now=10000000002).priority == 1
    assert ScanState.objects.get(pk=1).checkpoint['parsed_notes'] == 2


def test_reappearance_ends_old_absence_grace_even_if_next_check_is_missing(wiki, monkeypatch):
    from indexing import worker, graph_projection
    from indexing.queue import invalidate_path
    from indexing.models import IndexedNote, IndexJob
    path = wiki / 'note.md'
    path.write_text('# Preserve through rename race')
    drain(worker)
    invalidate_path('note.md', now=0)
    IndexJob.objects.update(missing_since=0, not_before=0)
    path.unlink()
    original = graph_projection.path_fingerprint
    observations = iter(['file', 'missing'])
    def raced(candidate):
        return next(observations, None) or original(candidate)
    monkeypatch.setattr(graph_projection, 'path_fingerprint', raced)
    assert worker.run_batch(now=10000000001).state == 'backoff'
    assert IndexedNote.objects.filter(generation__state='active', path='note.md').exists()
    assert IndexJob.objects.get().missing_since is None
