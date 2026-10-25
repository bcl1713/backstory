# Backstory

A lightweight, self-hosted Markdown wiki browser and source editor for one shared
directory of plain files.

**Status: design review.** Application implementation has not started.

Read the [proposed design and staged implementation plan](docs/superpowers/specs/2026-10-25-backstory-design.md).

The proposed stack is Django, SQLite FTS5 and CodeMirror, packaged for Docker
Compose. The server indexes the authorized wiki through low-priority background
jobs; browsers fetch only requested content and bounded search results.

Development will use disposable synthetic fixtures. This repository contains
project documentation only, with no wiki snapshot, private notes or credentials.
