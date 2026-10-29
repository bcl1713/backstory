# Install Backstory on Android

Open your existing **HTTPS** Backstory address in Android Chrome. Use the browser
menu's **Add to Home screen / Install app** action (wording varies by Chrome
version), confirm Backstory, and launch its book icon. No custom install button
or new account is required. On browsers without installation support, continue
using the same site in a normal tab. HTTP is only suitable for localhost testing,
not a phone opening another machine's LAN address.

The installed app opens the canonical `/` homepage in a standalone window, not a
pinned folder or the note that happened to be open during installation. A root
`index.md`, when present, is the homepage; the file tree remains available.
Normal note URLs, Back navigation, search, editing and protected drafts use the
same application and session as browser navigation. Sessions still expire and
can be revoked; installation does not grant access or bypass sign-in. Use the
existing Remember this device option only on a trusted device.

## Network, privacy and updates

This is **online-first**, not an offline wiki. There is deliberately no service
worker, Cache Storage, precached private content, queued write or background sync.
[Current Chromium installability requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
allow manifest-based installation without a service worker. Private Django
responses retain `Cache-Control: no-store`; static assets contain no user data.
The manifest and icons are public so installation also works at sign-in.

When the browser reports offline, an advisory explains that opening notes,
search and saving need a connection. Browser connectivity detection is only a
hint: a failed request remains authoritative even if no advisory is shown. An
already-open editor can retain local work but **do not close it assuming edits
were saved**. Existing save errors, conflict review and protected-draft behavior
remain in charge. Reconnect and verify a successful save (or resolve the reported
conflict); this feature never retries writes or reloads the page for you.

There is no service-worker shell to become permanently stale after deployment.
New page loads fetch the current application under its existing cache policy;
an already-open editor is never forcibly refreshed for an update. Finish or
protect your work before manually reopening/reloading. Browser-managed icon or
manifest updates can lag; reinstalling is not a substitute for protecting work.

## Validation and remaining device check

Executed integration/unit tests check manifest fields, actual PNG dimensions,
metadata on sign-in and authenticated pages, and offline advisory transitions.
Authored browser tests additionally check public asset retrieval, no registered
service worker, and disconnect/reconnect without a false save or lost in-memory
edit. Run the browser CI job (all four shards) before accepting a change.
Existing editor suites provide regression tests for authentication failures,
conflict handling, protected drafts, navigation guards and failed writes.

The implementation workspace verified Python 3.14.8 integration tests and Node
22 unit tests. Local browser execution was unavailable because of browser-download
and socket restrictions; the repository's GitHub Actions browser job supplies
Chromium Headless Shell 156.0.8078.4 on Linux. Consult the PR checks for the
current browser-suite result. Desktop/headless verification is not an Android
installation test.

**Real Android installation has not been verified in this cloud workspace.** No
Android OS/Chrome device version is claimed as tested. Before calling the Android
acceptance complete, record device, Android version and Chrome version and check:

1. Install from the deployed HTTPS origin; verify book icon, Backstory label and
   standalone launch. Quit/reopen; it must start at `/`, not the installing URL.
2. Follow a note deep link, search, navigate Back, edit and save; confirm the wiki
   changed only after success. Check an expired/revoked session and sign in again.
3. Disconnect during editing and attempt save: no successful-save claim or loss
   of the local edit. Reconnect, save, and exercise a concurrent-edit conflict.
4. Deploy a newer build while a dirty editor stays open: no forced reload or loss.
   Protect/save work, reopen, and verify the new build and no stale private page
   after logout. Installed apps do not add an independent draft store.
