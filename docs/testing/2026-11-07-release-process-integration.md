# Issues 116 and 117 integration evidence

Review base: graph release merge `e76d9c2f0586894611c73551c981c3704d490f7a`.
Reviewed process snapshot: `bbe25d0382531758e90de261da1cb82b69a7d00b`.
The graph application sources and assets match that base; these changes concern
candidate/release orchestration, browser gate selection, fixtures and guidance.

Integrated issue 117 commits `d4fe43b`, `bee449b`, `9c2035e` and issue 116 commits
`0d4bdb4`, `23c6d9f` in a separate checkout. Resolved shared scripts/docs/tests by
keeping receipt schema 3 and installed dependency/runtime provenance, installing
Firefox before the input snapshot, removing the stock automatic lanes, retaining
both Firefox projects plus all 32 profile combinations and the new graph tests.
The first automated conflict-resolution attempt truncated four files; full files
were restored from the agent commits before checks and compared with those
sources. No truncated source was pushed or used for a test/publication run.

## Focused integration checks

- `/home/oracle-worker/Work/backstory/.venv/bin/python -m pytest tests/unit/test_local_candidate.py tests/unit/test_local_publisher.py tests/unit/test_local_ci.py tests/unit/test_local_release.py tests/unit/test_receipt_inputs.py -q`:
  61 passed and one failed in 3.92s. The failure was an integration assertion still
  expecting the deliberately removed Selenium/stock command in the gate plan.
- After correcting that assertion to preserve issue 117's required gate contract,
  ran only `tests/unit/test_local_ci.py::test_plan_uses_focused_browser_and_container_gates -q`:
  one passed in 0.09s. The other 61 inputs remained unchanged.
- After integrating the installed-dependency provenance follow-up, ran only
  `tests/unit/test_receipt_inputs.py -q`: six passed in 0.04s. It replaces the
  earlier three provenance cases and adds three meaningful dependency cases.
  Combined evidence covers **65 distinct passing focused tests**; this is not
  a fresh full-suite pass.
- `node_modules/.bin/playwright test --config playwright.firefox.config.js --list`:
  collected **70 tests in seven files**, including required graph controls and
  all five Firefox profile projects. Collection is not a browser test pass.
- `git diff --check`: passed. Relevant existing browser evidence from issue 117
  and graph evidence from issue 119 are retained; their test bodies/application
  assets were not changed by integration.

The provided Python 3.14.4 virtualenv and Node 22.12.0/node_modules were reused;
no dependency installs or full gate were run for this integration. The release
gate requires its separately pinned tools. Total additional verification was
under ten seconds.

## Review and release boundaries

The issue 116 implementer independently reviewed issue 117 and found no blockers.
The graph implementer then independently reviewed the combined snapshot above,
including exact merge identity, atomic head/base landing, stale/failed evidence,
local/required GitHub review, source-root package/runtime fingerprints, retries,
immutable image guards and migration guidance, and found no blockers. Review
did not repeat passing tests.

Ruling: atomic dev-to-main promotion advances both refs to the tested merge at
landing, rather than synchronizing dev after publication. This is needed to check
both refs atomically; both remain fast-forwards to fully tested source. A stable
publication failure can leave that tested source on both branches while stable
upload awaits retry. Each channel records only an actually completed release.

This branch has not been landed or installed as the live controller. Its full
candidate gate and documented controller/state migration are still required
before activation; the existing publisher remains responsible for issue 119.
Local review/receipts are trusted operator evidence, not signed attestations.
Protected remote atomic pushes and live controller rollout were not exercised.
