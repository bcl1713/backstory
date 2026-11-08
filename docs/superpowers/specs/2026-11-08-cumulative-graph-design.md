# Cumulative graph exploration — issue 141

Authority: https://github.com/bcl1713/backstory/issues/141 (full acceptance criteria).

Local exploration retains its opening root, topology, positions and camera. Selection expands outgoing depth from any selected node; BFS springs stay rooted at the opening note. Whole-wiki remains separate. Reuse the existing index, guarded query/session and batched Three.js renderer.

Approach: extend guarded indexed traversal with a reusable, stamp-bound exploration token and efficient work batches. This permits complete induced directed evidence across accumulated membership and reuses adjacency. Client-only independent neighborhoods would repeat work and miss cross-neighborhood evidence; replacing the renderer is unnecessary. Keep resource bounds per response, automatic continuation, replay/cancellation and honest errors.

Hints use graph-only `f` activation and prefix-free codes, frozen while entering keys; immediate outgoing neighbors get shortest codes. Labels prioritize selection and immediate neighbors, then quiet secondary labels when space permits. Mesh and glow use world geometry projected by the camera; text, hints, focus and hit targets remain usable in screen space.

Preserve auth, filesystem eligibility, stamp/cursor revocation, note-navigation guards, force/pause/reduced motion, theme and mobile controls. No neighbor list, graph ceiling, fabricated links or note mutation.
