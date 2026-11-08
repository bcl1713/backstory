"""Bounded fake-clock recovery plus a disposable Linux notification smoke."""
import os
import pytest
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


class FakeWatch:
    complete = True
    def __init__(self):
        self.events = []
    def poll(self):
        events, self.events = self.events, []
        return events
    def close(self):
        pass


def test_startup_overflow_restart_and_unavailable_are_durable(wiki):
    from indexing.watcher import WatchService
    from indexing.models import ScanState
    backend = FakeWatch()
    with WatchService(factory=lambda: backend) as watcher:
        watcher.poll()
        assert ScanState.objects.get(pk=1).reconcile_needed
        ScanState.objects.filter(pk=1).update(reconcile_needed=False)
        backend.events = [(None, 'overflow')]
        watcher.poll()
        assert ScanState.objects.get(pk=1).reconcile_needed
    ScanState.objects.filter(pk=1).update(reconcile_needed=False)
    with WatchService(factory=lambda: (_ for _ in ()).throw(OSError('unavailable'))) as watcher:
        watcher.poll()
        state = ScanState.objects.get(pk=1)
        assert state.reconcile_needed
        assert state.watcher == {'mode': 'poll', 'health': 'degraded', 'reason': 'watch_unavailable'}
        ScanState.objects.filter(pk=1).update(reconcile_needed=False)
        watcher.poll()
        assert not ScanState.objects.get(pk=1).reconcile_needed, 'retry cooldown must allow a repair pass to finish'


def test_poll_only_never_attempts_native_and_keeps_verification(wiki, settings):
    from indexing.watcher import WatchService
    from indexing.models import ScanState
    settings.BACKSTORY_INDEX_WATCH_MODE = 'poll'
    with WatchService(factory=lambda: pytest.fail('poll tried native')) as watcher:
        watcher.poll()
        state = ScanState.objects.get(pk=1)
        assert state.reconcile_needed
        assert state.watcher['mode'] == 'poll'


def test_events_apply_policy_and_coalesce_without_reading_bodies(wiki):
    from indexing.watcher import WatchService
    from indexing.models import IndexJob
    backend = FakeWatch()
    backend.events = [('note.md', 'path'), ('note.md', 'path'), ('.syncthing-temp.md', 'path'),
                      ('Syncthing notes.md', 'path'), ('asset.png', 'path')]
    with WatchService(factory=lambda: backend) as watcher:
        watcher.poll()
    assert set(IndexJob.objects.values_list('path', flat=True)) == {'note.md', 'Syncthing notes.md', 'asset.png'}
    assert all(IndexJob.objects.values_list('invalidated', flat=True))


@pytest.mark.skipif(not os.path.exists('/proc/self/fd'), reason='Linux native smoke')
def test_native_smoke_atomic_replace_and_new_directory(wiki):
    import time
    from indexing.watcher import NativeWatcher
    backend = NativeWatcher()
    try:
        for _ in range(20):
            backend.poll()
            if backend.complete:
                break
        assert backend.complete
        (wiki / '.editor-temp').write_text('# Synthetic')
        os.replace(wiki / '.editor-temp', wiki / 'note.md')
        (wiki / 'new').mkdir()
        (wiki / 'new' / 'inside.md').write_text('# Nested')
        events = []
        for _ in range(100):
            events.extend(backend.poll())
            if ('note.md', 'path') in events and backend.complete:
                break
            time.sleep(.005)
        assert ('note.md', 'path') in events
        (wiki / 'new' / 'inside.md').write_text('# Changed')
        for _ in range(100):
            events.extend(backend.poll())
            if ('new/inside.md', 'path') in events:
                break
            time.sleep(.005)
        assert ('new/inside.md', 'path') in events
    finally:
        backend.close()


def test_directory_move_and_watcher_loss_repair_through_verification(wiki):
    from indexing import worker
    from indexing.watcher import WatchService
    from indexing.models import IndexedNote, ScanState
    from tests.integration.test_indexing import drain
    (wiki / 'old').mkdir()
    (wiki / 'old' / 'note.md').write_text('# Original')
    backend = FakeWatch()
    with WatchService(factory=lambda: backend) as watcher:
        watcher.poll()
        drain(worker)
        (wiki / 'old').rename(wiki / 'new')
        backend.events = [(None, 'directory_changed')]
        watcher.poll()
        drain(worker)
        assert set(IndexedNote.objects.filter(generation__state='active').values_list('path', flat=True)) == {'new/note.md'}
        (wiki / 'new' / 'note.md').write_text('# Recovered')
        backend.poll = lambda: (_ for _ in ()).throw(OSError('lost'))
        watcher.poll()
        assert ScanState.objects.get(pk=1).reconcile_needed
        drain(worker)
        assert IndexedNote.objects.get(generation__state='active').title == 'Recovered'


def test_excluded_file_burst_does_not_request_verification(wiki):
    from indexing.watcher import WatchService
    from indexing.models import IndexJob, ScanState
    backend = FakeWatch()
    with WatchService(factory=lambda: backend) as watcher:
        watcher.poll()
        ScanState.objects.filter(pk=1).update(reconcile_needed=False)
        backend.events = [(f'.syncthing-{n}.md', 'path') for n in range(300)]
        backend.events += [('Syncthing notes.md', 'path')]
        watcher.poll()
        assert not ScanState.objects.get(pk=1).reconcile_needed
        assert set(IndexJob.objects.values_list('path', flat=True)) == {'Syncthing notes.md'}
        backend.events = [(f'allowed-{n}.md', 'path') for n in range(257)]
        watcher.poll()
        assert ScanState.objects.get(pk=1).reconcile_needed


@pytest.mark.skipif(not os.path.exists('/proc/self/fd'), reason='Linux native smoke')
def test_native_excluded_directories_and_moves_across_policy(wiki, settings):
    from indexing.watcher import NativeWatcher
    settings.BACKSTORY_EXCLUSIONS = ['admin']
    backend = NativeWatcher()
    try:
        for _ in range(20):
            backend.poll()
            if backend.complete:
                break
        assert backend.complete
        assert backend.poll() == []
        for name in ('.ignored-temp', 'admin', 'syncthing-temp', 'Syncthing folder.md'):
            (wiki / name).mkdir()
            assert backend.poll() == [], name
            (wiki / name).rmdir()
            assert backend.poll() == [], name
        (wiki / 'allowed').mkdir()
        (wiki / 'allowed' / 'inside.md').write_text('# Synthetic')
        assert (None, 'directory_changed') in backend.poll()
        assert backend.complete
        (wiki / 'allowed').rename(wiki / '.excluded')
        assert (None, 'directory_changed') in backend.poll()
        (wiki / '.excluded').rename(wiki / 'returned')
        assert (None, 'directory_changed') in backend.poll()
        assert backend.complete
        (wiki / 'returned' / 'inside.md').write_text('# Changed')
        assert ('returned/inside.md', 'path') in backend.poll()
    finally:
        backend.close()
