# Continuous graph presentation

The requested behavior is quiet periodic refresh, a camera centered on the
selected note, gentle three-axis idle rotation, and live node/link reconciliation
without replacing the whole scene. Keep the existing Three.js renderer and
authorized full-snapshot transport. Errors and scope changes still clear evidence.

Reuse scene batches with capacity growth only when necessary; update active draw
ranges on additions/removals. Preserve surviving physics objects and gestures.
Rebuilding batches on each change is simpler but causes unnecessary allocation;
per-node scene objects lose the existing fixed draw-call advantage.

Track the selection independently of the opening BFS root. Selection transitions
ease at the current zoom/orientation; physics motion carries the camera center.
Pan temporarily takes control, then tracking resumes after an idle delay. Rotate
yaw, pitch and roll slowly at unequal rates. Pointer/keyboard/wheel input and hint
mode suspend idle rotation; pause, reduced motion, hidden/list/closed state stop it.
Render projection, picking and the Three.js camera from the same rolled basis.

Periodic requests keep accepted presentation/status until reconciliation. Initial
loading, manual refresh and failures retain explicit feedback. This changes no
authorization, indexing, publication, or server API behavior.
