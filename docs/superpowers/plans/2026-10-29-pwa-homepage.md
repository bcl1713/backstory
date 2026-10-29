# PWA and root homepage implementation plan

Goal: implement issues #29 and #30 on `dev`, without changing deployment,
authentication, storage, formatting, or private-draft policies.

Architecture: render exact root `index.md` through the existing note response;
`/?folder=` always remains the explicit root tree. Supply a same-origin static
manifest and icons, with no service worker or additional offline storage.

Specs: https://github.com/bcl1713/backstory/issues/29 and
https://github.com/bcl1713/backstory/issues/30.

Tech: Django, existing CodeMirror editor, static asset build, pytest, Playwright.

Tasks (test first):
1. Test homepage selection, fallback, explicit navigation, and error distinctions.
2. Share normal note rendering and add homepage selection; preserve tree access.
3. Test and add manifest, icons and online-only installation documentation.
4. Exercise browser navigation/edit protection; run regression suites.
5. Independent review, address findings, prepare draft PR against dev.

Review focus: no error-to-missing masking; true note identity and authorization;
private data never cached by a worker; no forced reload of unsaved editing;
no changes to live wiki/task files. Android installation over production HTTPS
requires a real-device manual check and must not be claimed from desktop tests.

## Execution ledger

- Homepage tests failed for missing note selection/error distinctions, then
  passed after sharing the normal note response; pagination/read-error added.
- PWA metadata and connectivity unit tests observed RED then GREEN.
- Independent reviewer found no correctness/security issues; recommended a
  save-from-home browser regression, now added.
- Browser regressions are authored but not executed here: pinned Chromium
  download was invalid, local Chromium IPC was denied by the sandbox, and the
  supported escalation runner failed before launching the command. The supported
  cloud preview could not reach the isolated localhost server. No workaround
  changes to security, network configuration, or production were made.
- Android HTTPS install/update/device acceptance remains the explicit manual
  checklist in docs/pwa.md. Draft PR only, no merge or deployment.
