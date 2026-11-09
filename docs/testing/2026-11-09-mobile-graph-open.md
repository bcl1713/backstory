# Direct opening of the selected graph note on mobile

Follow-up to #151 on `fix/graph-mobile-open`, based on
`a2bb768798d954fa8426c46fa8f36cc64340104e`.

A node tap selected/expanded the note, but opening required Evidence or a
keyboard. The existing selected-title status row now contains an explicit
44px-high **Open note** link. It uses the accepted snapshot's validated href and
the existing document-level unsaved-draft guard. Selection/root/camera behavior
is unchanged. The link is hidden and its href/accessibility label are removed
when evidence is suspended, revoked or destroyed. The status row stays on top
when longer status content scrolls; no new toolbar or gesture was introduced.

The selection announcement now states the selection without a keyboard-only
instruction. Existing Evidence opening and Enter remain available.

## Focused evidence

- Baseline regressions: three failures for the missing direct Open action.
- Initial implementation: all three passed (6.7s).
- After the final status copy and existing Evidence-link selector adjustment:
  five Chromium scenarios passed (10.5s): real touch selection and native opening
  at 320px/390px, existing dense 320px immersion, missing-WebGL navigation,
  unsaved-draft cancellation and clearing the destination after a 401 refresh.
- The Firefox gate disables touch emulation. The new guard case initially failed
  at its test-only `.tap()`. It now activates the native link using `.click()`;
  dedicated Chromium phone scenarios retain real touch input. The focused
  Firefox guard/revocation case passed. Application code did not change.
- `npm run build` and `git diff --check` passed. Built graph controller/CSS are
  retained with source changes. No backend or physics tests were added.

Environment: Node 22.12.0, Python 3.14.4, Playwright 1.64.1; disposable synthetic
fixtures only, ports 8864/8865. Full logs/traces are retained under
`/tmp/backstory-mobile-open-{red,green,final,firefox,firefox-green}*`.
Screenshots: [390px](../screenshots/graph/mobile-open/390px.png) and
[320px](../screenshots/graph/mobile-open/320px.png). Both were inspected; the link
is visible, unobscured, and at least 44px in each dimension. These are automated
browser touch checks, not physical-device testing.

An independent reviewer inspected the diff, both final screenshots and focused
results without rerunning tests. No blocking code/UI findings were identified.
The unchanged focused evidence is reused for review. Any merge/publication must
use its own exact proposed-merge gate receipt and independent review record in
the trusted candidate store, without rerunning tests after landing.
