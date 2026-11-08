# Immersive graph exploration (#151)

Implement the detailed scope and acceptance in issue #151. The graph fills the
available viewport; compact actions and truthful status sit over the canvas.
Controls (including explicit filters and existing forces), selected-note evidence
and diagnostics, Find, and Help open as dismissible layers. On phones these are
bounded sheets over the same canvas. Each layer has a close button, keyboard
access, and focus return; Escape dismisses the active layer before graph exit.
The existing guarded navigation, Back, hints, and alternate connection list stay.

Approaches considered: retaining the sidebar cannot recover canvas width;
putting every action into a toolbar recreates the clutter. Use one compact action
layer with on-demand sheets, reusing the existing controls and evidence content.
This is an implementation choice based on the issue's specified overlay design.

Find searches the authorized loaded snapshot by title/path, with bounded results
and honest filtered/incomplete scope text. Typing and cancelling never alter the
snapshot, root, camera or selection. Choosing a result uses selection/expansion.
Filter form edits are drafts until Apply; automatic refresh and depth actions
use committed scope. No backend/search/physics protocol changes.

Labels belong to selection and one-hop outbound destinations. Keep collision
checks and prior local slots, bound leaders, and reject leader crossings rather
than routing identities to distant margins. Label omission never removes graph
records. Use one primary state outline per node, with small non-color accents
and an accessible role description for coincident current/selection/focus/root.
Evidence rows separate path, occurrence count, action and source disclosure.

Verification is focused: existing label/renderer tests, desktop and phone browser
scenarios, and synthetic screenshots. No benchmarks, merge, deployment, release
gate or live note access is part of this task.
