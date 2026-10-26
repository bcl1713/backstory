# Open-note synchronization

Implement [issue #16](https://github.com/bcl1713/backstory/issues/16) against `dev`.
An open note should follow external changes without losing a human draft.

## Approach

Use the existing authenticated `/tools/read/` source/revision/encoding snapshot.
Poll visible tabs every five seconds, and recheck on focus, visibility restoration,
and completion of a tool write. Push infrastructure adds unnecessary state;
checking only on Save leaves clean views stale. These are implementation choices.

Keep the loaded base and revision together outside editor undo history. A clean
editor adopts the snapshot. A dirty editor merges nonoverlapping line edits from
the base; identical changes coalesce. Ambiguous/overlapping changes retain the
draft and original base and show persistent comparison/recovery controls. Bound
diff work and conservatively report conflict for broad changes that exceed it.
Never save a merged draft automatically. Conditional saves remain authoritative.

Apply minimal editor transactions with selection mapping, a scroll snapshot, and
an isolated undo event. Undo changes text, never the adopted revision. Preserve
exact source endings, content FEFF, and encoding metadata. Support plain fallback.

Serialize reads; discard responses if an intervening write/base transition makes
them obsolete. Calculate merges from the live draft after each read. Pause during
Save, Format, tool writes, composition, and explicit review actions. A shown
conflict stays in review until an explicit action; new reads update its comparison.
Reload and manual merge read again, reject a changed comparison/draft, and require
confirmation before discarding unsaved edits. Draft copying/downloading and
protected recovery remain available without leaving the page.

Deletion or movement, storage outages, authentication and read errors are not
empty documents. Keep source/base and show persistent actionable explanations.
Do not infer a moved destination or recreate an absent note automatically.
Historical revision previews do not automatically synchronize. Recovered drafts
keep their original base and use the same comparison protection.

## Verification

Use only generated synthetic notes. Cover clean refresh and subsequent Save;
disjoint merge retaining unsaved edits; overlapping conflict/copy/reload;
typing and newer revisions during pending reads/actions; deletion/outages/auth;
tool writes; undo/selection/scroll; BOM/mixed endings and valid empty notes.
Run the Python, formatter/merge, and browser suites and review the branch diff.
