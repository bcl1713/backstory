# Automatic local publication

Merging to `dev` or `main` must automatically test, build, tag, upload images and
publish the matching GitHub release. The user selected `forge` as the persistent
publisher. GitHub Actions stays disabled.

A user systemd service polls the canonical repository every 30 seconds. Polling
needs no inbound port, webhook secret or Actions runner registration. A webhook
would need a reachable listener; self-hosted Actions would require re-enabling
Actions and replacing the historical main workflows. Neither is needed here.

One publisher lock serializes both channels. Every attempt gets a new private
checkout, evidence directory and release-assets directory. It runs the existing
complete local gate, verifies its exact source receipt, rechecks the branch, then
calls the existing release script automatically. `dev` publishes prerelease
version tags and only `:dev`; `main` publishes stable versions and stable aliases.
No application deployment is triggered.

Atomic persistent state records publication only after success. Failures retain
logs and retry after five minutes; a changed branch starts a new attempt without
waiting for the failed revision's retry. Existing image digests are reused by the
release script on partial-publication retries. Service stop drains an in-flight
attempt rather than canceling an upload. Only the service's own private checkouts
are created or cleaned; developer workspaces are never reset.

An explicit baseline operation records the existing historical `main` revision
as ignored, without claiming it was published. Initial `dev` is not baselined, so
starting the service catches up the current merged development revision. Future
changes to either branch publish automatically. Operator status is available
from JSON state, journal logs and per-attempt receipts.

Deployment uses the existing GitHub identity, rootless Docker socket, pinned
Node/uv, browser OS dependencies and a named multiarch builder on forge. Existing
GitHub authentication supplies GHCR login through stdin into a private Docker
configuration; no token is printed or minted. The service/controller checkout is
separate from release source checkouts and is updated deliberately during service
maintenance.
