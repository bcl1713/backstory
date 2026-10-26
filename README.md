# Backstory

A local Markdown wiki browser and editor. Plain files stay authoritative;
CodeMirror provides inline live preview, Raw source and a plain-text fallback.
Named accounts share bounded folder/search access, conflict-checked saves,
explicit formatting recovery, protected drafts and revision history. One
non-root container supervises Gunicorn and background SQLite indexing.

Start here: [initial setup](docs/setup.md). **Already have a wiki?
[Connect the existing folder](docs/setup.md#2b-start-with-an-existing-wiki).**
The [configuration reference](docs/configuration.md) has minimal local/HTTPS
recipes and the complete variable inventory, requirements, defaults and remedies.
Configure a private `.env`, then use ordinary `docker compose up -d --build`.
The guide covers matching the wiki owner with fresh private application data,
a build-free Portainer Standalone manifest, and an optional disposable demo.
The [HTTPS proxy guide](docs/reverse-proxy.md) defines the shared contract for
Caddy, Nginx Proxy Manager and other compatible frontends.
[Cloudflare Tunnel](docs/cloudflare.md) is also supported: reuse an existing
connector without giving Backstory a token, or choose the optional bundled connector.
[Local development](docs/development.md) covers the native synthetic workflow;
[operations](docs/operations.md) covers recovery and backup/restore.
No private notes, default passwords or production configuration ship here.

[Storage policy](docs/storage.md), [safe preview](docs/preview.md),
[limitations](docs/limitations.md) and [release checks](docs/testing/release-checklist.md)
explain the boundaries. Application data and its signing secret stay outside the
wiki. Storage readiness uses an owner-approved root `.backstory-marker` file;
its contents are never read or hashed, and it is excluded from wiki content.
Startup never creates or repairs a missing wiki or marker. Older installations
should follow the [marker migration steps](docs/setup.md#migrate-from-a-visible-marker-and-hash).

The [design](docs/superpowers/specs/2026-10-25-backstory-design.md) and
[ordered implementation plan](docs/superpowers/plans/2026-10-25-backstory-implementation.md)
record the first release. Local delivery does not authorize deployment, public
exposure, live storage changes or merging the feature branch.
