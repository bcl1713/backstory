# Durable WebMCP move preparation evidence

## Scope

Baseline: `a2bb768798d954fa8426c46fa8f36cc64340104e` (published/deployed dev267).
The native host reported a 14.719-second inner evaluation timeout before any
preview handle returned. Its source fixture remained unchanged. This change
returns a durable preparation UUID before inventory/parse work, and preserves
that UUID when the worker atomically publishes the complete guarded plan.

The existing supervised index worker owns preparation, not an HTTP thread.
Status reads never run or resume it. Source/storage/policy/actor/expiry guards,
shared quotas, cancellation, interrupted-owner handling and full reviewed-token
commit remain protected. Pending/failure metadata contains no partial plan or
commit token; preparation does not mutate wiki content. The synchronous domain
and ordinary UI workflows remain supported. The new migration adds only durable
preparation metadata and its settlement timestamp.

## Focused evidence

All checks used disposable synthetic storage/databases, existing locked repo
`.venv` (Python3.14/Django5.2.18), pinned Node22.23.4/Playwright1.64.1 and public
executor selectors from `/tmp/backstory-128-runtime.sh`. No live credentials,
private note source, filesystem permissions or deployment settings were changed.

- RED: new HTTP test forbade planner calls during preview/GET. Baseline endpoint
  failed at its synchronous `_plan` call (0.57s), establishing the response-lifecycle
  defect. Backend and post-enqueue lost-handle/settlement-retention regressions
  also recorded failing cases before their respective changes.
- `python -m pytest tests/integration/test_move_previews.py -q`:
  **34 passed in 1.51s** on final backend state. Real SQLite WAL/DELETE concurrency,
  shared capacity/quota and exact metadata-to-plan replacement accounting;
  pre/post-plan context and actor checks; same-ID publication; cancellation before
  and during planning; live/abandoned worker ownership; explicit failures; settled
  retention. Evidence: `/tmp/backstory-148-durable-backend-evidence.md`.
- `python -m pytest tests/integration/test_management_tools.py -q`:
  **43 passed in 1.79s** on final adapter state. Includes atomic lookup/cancellation
  publication races and retained ID after post-enqueue readback failure. Evidence:
  `/tmp/backstory-148-durable-adapter-evidence.md`.
- `node tests/formatter/wiki-management-tools.test.mjs`: **2 passed**. Strict pending
  and cancellation responses accepted, malformed/partial/token-bearing preparation
  rejected; no transport auto-poll or mutation replay. No transport source changed
  after that pass, so it was reused.
- `python -m pytest tests/integration/test_async_move_tools.py tests/integration/test_relocations.py tests/integration/test_relocation_concurrency.py tests/integration/test_history.py tests/integration/test_storage_recovery.py tests/integration/test_tool_saves.py -q --tb=short`:
  **98 passed in 8.35s**. Includes prompt HTTP handle without planner invocation,
  status inspection while a real worker thread holds the planner lock, actual
  `run_indexer --once` scheduling, and shared quota/history/domain compatibility.
  Log: `/tmp/backstory-148-durable-integration.log`.
- After review identified pending-state API coverage gaps, ran only the three
  newly added tests with
  `python -m pytest tests/integration/test_async_move_tools.py -k 'unready or failed_preparation or queued_status' -q --tb=short`:
  **3 passed in 0.56s**. Proves pending commit refusal, pending/failed cancellation,
  cross-actor and current-policy denial. Earlier passing inputs remained unchanged;
  these results are combined focused evidence, not a fresh full-file rerun.
- `npm run build`: passed; generated `static/wiki-tools.js` matches source.
- `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-148-durable-browser BACKSTORY_BROWSER_PORT=8893 npx playwright test tests/browser/wiki-management-tools.spec.js --reporter=list`:
  **5 passed in 9.8s**. Real HTTP under the browser tool-registration stub covers
  queued-handle/worker/GET/complete-plan flow and retained incoming-link and
  unsaved-folder-child draft guards, plus existing lifecycle/uncertainty behavior.
  The browser fixture runs the worker explicitly because its server fixture
  supervises HTTP only; production supervision runs the actual continuous worker.
  Log: `/tmp/backstory-148-durable-browser.log`. Screenshot:
  `/tmp/backstory-148-durable-browser/move-preserved-incoming-draft.png`.
- `git diff --check`: passed.

## Release and live limits

Independent code/browser evidence review and the required exact proposed-merge
full gate are retained in the candidate store/task handoff. Publication must use
that unchanged receipt without repeating the application gate. Prior unchanged
visual evidence can be reused alongside the new browser flow screenshot.

No native-host acceptance is claimed here. After deployment of the exact new
release, the live agent must retain the prompt operation ID, inspect `get_move`
until a complete review or explicit failure, and only then review/commit the
bounded fixture move/archive and recoverable cleanup. Preserve earlier passing
creation, graph, history-restore and empty-folder cleanup evidence and #106's
closure. #148 remains open until its live requirements are satisfied.
