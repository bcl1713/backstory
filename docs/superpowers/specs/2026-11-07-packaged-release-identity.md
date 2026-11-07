# Packaged release identity (issue 70)

Expose the running artifact's package-time release identity through the existing
authenticated, read-only `/tools/status/` and `wiki_status` contract. Preserve
`application.name`, map `application.build` to the full tested source SHA, and
map `application.version` to the release version.

Use a JSON file beside the application module, generated after Docker's source
copy from `BACKSTORY_REVISION` and `BACKSTORY_VERSION` build arguments. The local
publisher already supplies these arguments from the exact tested commit.
The file is owned by the image builder and read-only to the runtime user.
Do not track generated identity in Git or admit it from a local Docker context.

Alternatives considered: runtime environment values are already used by formatter
logs but can be overridden independently of the artifact; Git, registry and Docker
socket lookups do not establish running identity and exceed this diagnostic's
boundaries. A packaged file gives status an artifact-local source without new
runtime settings, dependencies, credentials, network access or endpoints.

Read at most 1 KiB from the fixed module-relative path. Accept only a JSON object;
allowlist output fields and validate each independently. A source SHA is exactly
40 lowercase hexadecimal characters. Versions are bounded to 80 ASCII characters
and match the publisher's stable `MAJOR.MINOR.PATCH` or
`MAJOR.MINOR.PATCH-dev.COUNT.g0123456789ab` format, without leading-zero numeric
components. Each absent/invalid field becomes `unknown`; unreadable, malformed,
oversized or non-object metadata makes both unknown. Native checkouts and Docker
builds with no release arguments default to unknown. Runtime environment, current
Git head and image aliases never fill missing status values.

Tests must cover stable/dev packaging and status, all fallback cases, no sensitive
field disclosure, environment-override resistance, existing session authorization,
no-store, read-only behavior and public health remaining minimal. Review and local
validation precede any merge. Publishing and deployment are outside this change;
after operator deployment, read authenticated status and compare with that image's
release evidence without inferring deployment from a branch or registry alias.
