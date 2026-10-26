# Backstory

A local Markdown wiki browser and editor. Plain files stay authoritative;
CodeMirror provides inline live preview, Raw source and a plain-text fallback.
Named accounts share bounded folder/search access, conflict-checked saves,
explicit formatting recovery, protected drafts and revision history. One
non-root container supervises Gunicorn and background SQLite indexing.

**Deploy v1.0.0 without cloning or building:** use the
[published-image Portainer / Compose guide](docs/portainer.md),
[release assets](https://github.com/bcl1713/backstory/releases/tag/v1.0.0), and
`ghcr.io/bcl1713/backstory:1.0.0` (amd64 / arm64). It covers existing wiki storage,
`.env`, interactive named users, an existing Cloudflare Tunnel or Nginx Proxy
Manager for remote HTTPS, backups and upgrades.

The [editor guide](docs/editor.md) covers Zen, navigation shortcuts, clickable
live links and complete-document source access.
[Move and archive](docs/relocation.md) covers reviewed note/folder relocation and
recovery; [browser tools](docs/webmcp.md) describes the WebMCP read and guarded-save
adapter and the remaining actual-host write verification.

For source builds or a disposable demo, start with [initial setup](docs/setup.md).
The [configuration reference](docs/configuration.md) lists every variable.
The [HTTPS proxy guide](docs/reverse-proxy.md) defines the shared header/network
contract; the [Cloudflare guide](docs/cloudflare.md) includes existing-connector
reuse and an optional bundled connector. [Local development](docs/development.md)
covers the synthetic workflow; [operations](docs/operations.md) covers recovery.
[Release automation](docs/releases.md) explains versioning and GHCR publication.
Merge features into `dev` for automatic prereleases and the `:dev` test image;
promote `dev` to `main` for stable releases and the `:latest` production image.
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
record the application design. Publishing the application does not configure an
operator's live wiki, proxy, tunnel or firewall; follow the deployment guide for
your installation.
