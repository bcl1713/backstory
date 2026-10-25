"""Protected SQLite online snapshot; wiki backup is a separate operator action."""
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from wiki.revisions import application_lock


def file_digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


class Command(BaseCommand):
    help = ('Back up application SQLite into a new private directory outside wiki/data. '
            'Use --include-secret explicitly, or retain application-secret separately.')

    def add_arguments(self, parser):
        parser.add_argument('destination', type=Path)
        parser.add_argument('--include-secret', action='store_true', help='Include private signing material required to restore existing sessions.')

    def handle(self, *args, **options):
        destination = options['destination']
        if not destination.is_absolute():
            raise CommandError('Choose an absolute, new backup directory outside wiki and application storage.')
        # Reject symlink components, even if the resolved path would be outside
        # storage. Never repair an existing directory or its permissions.
        if any(parent.is_symlink() for parent in [destination, *destination.parents]):
            raise CommandError('Backup destination cannot contain symlinks.')
        target = destination.resolve()
        roots = [Path(settings.BACKSTORY_DATA_DIR).resolve(), Path(settings.BACKSTORY_WIKI_ROOT).resolve()]
        if any(target.is_relative_to(root) or root.is_relative_to(target) for root in roots):
            raise CommandError('Backup destination must not overlap wiki or application storage.')
        created = False
        try:
            target.mkdir(mode=0o700)  # exclusive, no parent creation
            created = True
            database = target / 'backstory.sqlite3'
            fd = os.open(database, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
            os.close(fd)
            # All revision/draft bytes are SQLite BLOBs today. Holding this lock
            # coordinates recovery mutation/pruning; SQLite backup supplies the
            # consistent snapshot of sessions/index/grants as well. No external
            # recovery blobs or pending-stage replay belongs in this manifest.
            source = Path(settings.DATABASES['default']['NAME'])
            with application_lock('revision-quota'):
                with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True, timeout=10)) as live:
                    with closing(sqlite3.connect(database)) as snapshot:
                        live.backup(snapshot)
                        if snapshot.execute('PRAGMA integrity_check').fetchone() != ('ok',):
                            raise OSError('Backup integrity check failed')
                included = ['backstory.sqlite3']
                if options['include_secret']:
                    secret = Path(settings.BACKSTORY_DATA_DIR) / 'application-secret'
                    source_fd = os.open(secret, os.O_RDONLY | os.O_NOFOLLOW)
                    output_fd = os.open(target / 'application-secret', os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
                    with os.fdopen(source_fd, 'rb') as reader, os.fdopen(output_fd, 'wb') as writer:
                        shutil.copyfileobj(reader, writer)
                        writer.flush()
                        os.fsync(writer.fileno())
                    included.append('application-secret')
                manifest = {
                    'schema': 1, 'created_at': datetime.now(timezone.utc).isoformat(),
                    'recovery_storage': 'sqlite-inline-blobs', 'external_blobs': [],
                    'application_secret': 'included' if options['include_secret'] else 'required-separately',
                    'files': {name: {'bytes': (target / name).stat().st_size,
                                     'sha256': file_digest(target / name)}
                              for name in included},
                }
                fd = os.open(target / 'manifest.json', os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
                with os.fdopen(fd, 'w') as stream:
                    json.dump(manifest, stream, indent=2)
                    stream.write('\n')
                    stream.flush()
                    os.fsync(stream.fileno())
                with database.open('rb') as stream:
                    os.fsync(stream.fileno())
                directory_fd = os.open(target, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
                try:
                    os.fsync(directory_fd)
                finally:
                    os.close(directory_fd)
        except (OSError, sqlite3.Error):
            if created:
                shutil.rmtree(target)
            raise CommandError('Application backup failed; original storage is unchanged. Check destination access and database health.') from None
        self.stdout.write('Protected application snapshot complete. Back up wiki files separately. '
                          + ('Keep the included signing secret private.' if options['include_secret'] else 'The existing application-secret must be retained separately for restore.'))
