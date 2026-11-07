# Issue 107 interface review

Reviewed against `docs/superpowers/specs/2026-11-07-graph-improvements-design.md`.
This is a source-based design review with synthetic regression scenarios, not
user research or a claim of real-device validation.

## Findings and implementation

| Journey | Observed issue or existing safeguard | Decision and acceptance |
| --- | --- | --- |
| Browse and search | The main shell mixed six destination links with Open note; three links were administration or occasional tools. Search has explicit incomplete/stale results warnings. | Keep Open note, Home, Search and Graph as primary destinations. Home still points to `/`, preserving canonical home behavior and draft guards. Storage status, Wiki timezone and Move / Rename move into a collapsed native Settings and tools disclosure. Keep the file tree ahead of secondary tools. Search form, result paging and actionable freshness warnings stay intact. |
| Edit and save | Notes already open in a quiet editor with persistent Menu, Save and Upload image. Rich/source/plain modes, formatting review, source recovery and optional Vim have established state contracts. | Retain the editor toolbar, mode controls and note-specific actions. Navigation grouping introduces no save, selection, history or autosave behavior. |
| Create notes and folders | Folder browsing exposes New note in this folder and New folder. Missing/ambiguous links offer explicit creation or a destination choice; the filename and existing parent are shown. | Preserve contextual creation routes, filename fields, collision decisions and explicit Create note / Create folder actions. No automatic creation or new global create flow. |
| Upload and relocation | Upload is reachable beside Save; upload and insertion are separate actions. Moves require an inventory/link preview, destination confirmation and journal-backed recovery. Note-specific relocation remains next to the note. | Preserve modal labels, Close/Escape/focus behavior, insertion into the retained draft, unsaved-move guards, preview/confirmation and recovery decisions. General Move / Rename remains available under Settings and tools. |
| Themes and settings | Theme upload, explanation and reset occupied persistent sidebar space. Wiki timezone is readable by ordinary accounts but writable only by staff/superusers. | Group the unchanged theme importer/reset, storage/timezone/move/session links and POST Sign out form under Settings and tools. Do not alter initialization flags, CSRF tokens, route permissions or timezone compare-and-set behavior. |
| Recent notes | Browser date/timezone and index explanation were displayed during every browsing session. | Keep Today result, the Recently modified heading and bounded recent links visible. Put browser date/timezone and index evidence in About today and recent notes. The Today lookup failure still explicitly says to check storage or sign in again; connectivity and storage warnings remain outside these disclosures. |
| Sync, conflicts and recovery | Connectivity, external-change banners, revision conflicts, reauthentication, formatting failures and stored-draft actions contain necessary recovery decisions. | Leave these controls and messages intact. Keep Protected drafts visible outside Settings and tools; sessions remain available inside it. No technical safety decision is replaced with a success-only summary. |
| Mobile, keyboard and Vim | The shell has native Browse disclosure, an editor Menu toggle, Escape-to-editor behavior and real destination links. Existing shortcuts and Vim state are managed in separate modules. | Use native details/summary for both new disclosures, reachable with Tab/Enter. Secondary tool links and disclosure summaries have at least 44px touch targets; labels wrap. Preserve selectors, the existing Menu focus/escape handlers, shortcuts, dialogs and Vim bindings. |

The chosen grouping follows the approved wireframes:

```text
Desktop sidebar                 Phone navigation disclosure
Open note                       Browse wiki
Home / Search / Graph             Open note / Home / Search / Graph
File tree                         File tree
Note actions (when applicable)     Note actions (when applicable)
Today / Recently modified         Today / Recently modified
About today and recent notes >     About today and recent notes >
Protected drafts                  Protected drafts
Settings and tools >              Settings and tools >
```

Graph controls, graph-first phone layout, selection evidence and the visual map
are owned by the graph implementation; this shell change preserves both graph
entry points and their existing selectors.

## Focused verification and handoff

Changed source: `wiki/templates/wiki/shell.html` and `static/src/app.css`.
No JavaScript runtime behavior or backend permissions changed.

The smallest meaningful browser checks are the existing responsive navigation
scenarios in `tests/browser/accessibility.spec.js` at 1440×1000 and 390×844.
They now check the primary destinations, initially collapsed settings/evidence,
keyboard opening/closing of native disclosures, exposed theme/session/logout
controls and the existing Escape-to-editor focus behavior. Existing theme
workflows now open Settings before importing or resetting a palette; the home
identity workflow uses the clearer Home link label.

Requested integration checks (root owns the single browser/build run):

- `accessibility.spec.js`: `responsive navigation and persistent actions` (both sizes).
- `themes.spec.js`: `imports a palette, preserves draft, history and geometry, remembers it and restores Tokyo Night`.
- `homepage.spec.js`: `home preserves note identity across refresh, tree, Back and deep links`.
- `vertical-slice.spec.js`: `dirty navigation, logout and unload are guarded; keyboard Save and textarea use the same write path`.
- `zen-first-paint.spec.js`: `delayed shell initializes with chrome still closed` (the expected focused destination is now labeled Home).

These checks establish changed navigation reachability, theme preservation and
Home identity. They do not establish a fresh full-suite pass. Existing source
coverage for creation, relocation, uploads, sync/conflicts and Vim was inspected;
those unchanged journeys do not justify another complete browser campaign.

This subtask did not start browser tests or an asset build, per integration
ownership. Static validation is below; root-run results/screenshots belong in
the combined issue 107 evidence. No prior test result is represented as fresh
evidence for this working tree. Remaining limits: synthetic desktop/phone
viewports, no real phone or assistive-technology study, no assistant-host WebMCP
validation, and no release-gate claim. The automatic publisher owns the full
release gate.

Static evidence on the working tree based on
`89f8832c7b4d9817591508f5d5065655d9d1ba68`:

- `node --check tests/browser/accessibility.spec.js`
- `node --check tests/browser/themes.spec.js`
- `node --check tests/browser/homepage.spec.js`
- `node --check tests/browser/vertical-slice.spec.js`
- `node --check tests/browser/zen-first-paint.spec.js`

All five commands exited 0; they establish JavaScript syntax only. Cumulative
subtask verification time was under one minute. Browser behavior and screenshots
remain the integration owner's checks; no browser result is claimed here.
