import sqlite3
from django.core.checks import Error, register


@register()
def sqlite_fts5(app_configs, **kwargs):
    try:
        with sqlite3.connect(":memory:") as connection:
            connection.execute("CREATE VIRTUAL TABLE fts_check USING fts5(content)")
    except sqlite3.DatabaseError:
        return [Error("SQLite FTS5 support is required", id="backstory.E001")]
    return []
