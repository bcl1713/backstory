# WebMCP management follow-up evidence

Base: dev `00a9e30580cdb7d77d3e86543dd258e53002156e`. Implementation is in
the same source commit as this record; exact merge identity/gate/review belong
to the retained candidate store. Only disposable synthetic wiki/data roots were
mutated. This record does not claim a fresh full suite from combined focused runs.

The #148 deployed follow-up confirmed #149's twelve tools, creation/snapshot
registration, depth-eight consistency and independent relationship readiness.
It identified a remaining source-level parse limitation and the lack of a bounded
path/code discovery tool. It did not identify or repair the private source, and
actual-host creation was still untested. This follow-up adds targeted diagnostics
and the remaining move/history/recoverable-cleanup interfaces.

## Focused evidence

- `tests/integration/test_tool_index_diagnostics.py`: eight tests passed, 0.87s;
  `/tmp/backstory-148-diagnostics-green-r2.log`. Initially failed on missing module,
  then one redundant-code expectation was corrected by reporting a resolution
  code only when parsing itself was complete. Covers fixed codes/current eligible
  source revision without body/metadata reads, bounded generation/scope/query
  cursors, policy/symlink/missing/changed sources, unknown-code redaction, auth,
  strict schema, no-store and unavailable storage. The test was initially run at
  `test_index_diagnostics.py`, then renamed to the new tool-specific file; the
  preexisting unrelated diagnostics test file was restored byte-for-byte.
- Move/history adapters: 40 tests passed, 1.53s; retained detailed evidence in
  `/tmp/backstory-148-management-adapter-evidence.md`. Covers bounded complete
  review/token, affected-link rewrite, old/current policy and actor binding,
  stale witnesses/collisions, history pagination and explicit source reads,
  exact BOM/current-revision restore, path relocation races, uncertain readback
  and acknowledgement loss without replay. Existing unchanged tool-save checks
  (30) and history/save domain checks (65, 14.30s) passed for shared-writer changes.
- Removal lifecycle: 20 tests passed, 1.04s, then two added unknown-stage cases
  passed, 0.46s, with the original 20 deselected and their evidence reused.
  `/tmp/backstory-148-evidence/removal-lifecycle.md` records exact commands and
  development failures. Includes exact note bytes/BOM, empty-folder lifecycle,
  same-actor parent restoration proof, foreign-parent rejection, restrictive
  umask permission preservation, actor/session/CSRF/schema, quota/retention,
  protected/symlink/hardlink/stale/nonempty/colliding targets, durable crash state,
  staged inode/byte checks, fsync/cleanup failures and post-publication DB failure.
  Unknown stages are preserved and refuse ownership adoption; deliberate
  no-overwrite quarantine followed by explicit restoration is demonstrated.
- Existing shared quota/recovery selection: 38 passed, 58 deselected, 1.66s:
  `tests/integration/test_relocations.py tests/integration/test_relocation_cleanup.py tests/integration/test_save_security.py -k 'quota or capacity or recover or rollback'`.
  Later removal-stage refinements do not invalidate this shared-quota evidence.
- Migration consistency check: `makemigrations wiki --check --dry-run` reported
  no changes; new `0005_removaloperation` supplies the durable journal model.
- `node --test tests/formatter/wiki-management-tools.test.mjs tests/formatter/wiki-tools.test.mjs`:
  two tests passed; `/tmp/backstory-148-adapter-final.log`. Real adapter execution
  with synthetic transport covers affected-path preflight/draft refusal,
  serialization during inspection, folder-prefix protection, explicit not-started
  rejection, lost acknowledgement with operation handle and no replay. Initial
  regression failed before tools existed; independent review caught folder
  prefixes and required kind validation, which were added before final evidence.
- `npm run build`: passed with pinned Node 22.23.4 and locked existing deps;
  `/tmp/backstory-148-management-build.log`. Generated editor and tool assets
  align with changed source. Other generated assets remained unchanged.
- `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-148-management-browser BACKSTORY_BROWSER_PORT=19649 node_modules/.bin/playwright test tests/browser/wiki-management-tools.spec.js`:
  five passed, 9.1s. `/tmp/backstory-148-management-browser.log`. Real local
  HTTP/storage/editor/formatter/index services, controlled WebMCP registration
  stub. Covers create/edit/history restore, exact remove/restore with parent
  cleanup, final absence of wiki fixture entries, incoming-link draft protection
  and real move, unsaved new child drafts under folder move/removal, lost removal
  acknowledgement and targeted malformed-source discovery. Recovery journals and
  history intentionally remain; wiki cleanup is not deletion of audit material.
  Screenshot: `/tmp/backstory-148-management-browser/move-preserved-incoming-draft.png`.
- Existing WebMCP browser file: 18 passed, one failed (23.6s) solely because its
  old discovery assertion expected exactly twelve tools instead of twenty-four.
  That test now checks usable read registration and its actual same-origin source
  behavior. Reran only the changed scenario: one passed, 3.2s, using
  `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-148-read-browser BACKSTORY_BROWSER_PORT=19651 node_modules/.bin/playwright test tests/browser/wiki-tools.spec.js -g 'signed-in tools read current'`.
  Logs `/tmp/backstory-148-existing-browser.log` and
  `/tmp/backstory-148-read-browser.log`. The unchanged 18 passing scenarios remain
  applicable, including creation/save/folder guards and lost acknowledgements.

Runtime: existing locked Python 3.14 environment and pinned Node 22.23.4;
`/tmp/backstory-128-runtime.sh` selectors for focused checks. Browser servers ran
outside the sandbox because fixture loopback binding requires that executor.
No OS/package/runtime mutation was needed. Detailed agent records retain tested
file hashes, commands, findings and reused evidence. Focused verification was
under two minutes; the required actual-merge full gate is separate.

## Independent review and acceptance limits

Independent fresh-context code/UI review: `/tmp/backstory-148-management-review.md`.
Reviewed actual incoming-link draft screenshot and retained results. Resolved
folder-prefix draft protection, malformed preflight kind, post-publication DB
uncertainty, restored permissions and parent restoration proof. Exceptional
unknown-stage ownership remains deliberately fail-closed, with a tested manual
quarantine/recovery path documented in [management operations](../webmcp-management.md).

Actual assistant-host invocation is unobserved: available connected document tools
support office surfaces, not Backstory WebMCP. Registration stubs do not satisfy
#106's actual-host create/read/edit acceptance. The implementation and reversible
fixture lifecycle are complete, but that native-host acceptance remains explicit.
Neither code publication nor local tests identify or repair the private malformed
source. Use the new bounded diagnostic read after deployment, inspect that exact
source and authorize any repair separately. No private content was read or edited
for this task, no recursive deletion/permanent purge was added, and remote MCP
remains outside scope under #46.
