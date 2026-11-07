# Retired GitHub Actions workflows

These workflows and their tests are historical migration references. The active
release pipeline is implemented by `scripts/local_ci.py`,
`scripts/local_release.py`, and `scripts/local_publisher.py`.

The `tests/` directory preserves 71 statically expanded pytest cases for the
retired workflow shell steps, GitHub evidence verifier, and artifact uploads.
They are outside the configured `testpaths = ["tests"]` and are not part of
normal development or release verification. Git retains their earlier history.

When deliberately investigating this retired implementation, run from the
repository root with the existing development dependencies:

```sh
uv run pytest docs/ci/retired-workflows/tests
```

This command is optional historical verification, not a release requirement.
Do not restore the retired workflows to `.github/workflows`.
