"""FTS is installed with schema migrations and maintained inside row transactions."""
FTS_CREATE = "CREATE VIRTUAL TABLE indexed_fts USING fts5(path, title, body, generation UNINDEXED, tokenize='unicode61')"


def enable_wal():
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('PRAGMA journal_mode=WAL')
