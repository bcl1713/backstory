# Backstory

A self-hosted Markdown wiki browser and source editor for one shared directory
of plain files. The first runtime slice is runnable: Django, SQLite FTS5 checks,
interactive Argon2 accounts, protected login/logout and bundled local assets.
Browsing and editing are being added through the staged plan.

Start with the [local development guide](docs/development.md), which generates a
synthetic wiki outside the checkout, installs locked dependencies and starts
Gunicorn on localhost. It also documents the non-root Compose workflow and
persistent application-data volume. No private notes or default accounts ship
with the application.

Read the [agreed design](docs/superpowers/specs/2026-10-25-backstory-design.md)
and [implementation plan](docs/superpowers/plans/2026-10-25-backstory-implementation.md)
for the remaining preservation, indexing and recovery work. Application state is
separate from wiki files; absent wiki storage is never initialized automatically.
