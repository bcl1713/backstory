# Graph continuity implementation

Spec: ../specs/2026-11-10-graph-continuity-design.md

1. Add focused failing tests for rolled projection, unequal bounded idle motion,
   selection following, and persistent batches across topology changes.
2. Extend camera orientation and focus tracking. Integrate idle motion with input,
   hint, pause, reduced-motion and animation lifecycle controls.
3. Reconcile renderer capacities/draw ranges without replacing scene batches;
   retain gestures for surviving nodes and clear removed derived identities.
4. Make automatic refresh quiet while preserving fail-closed revalidation.
5. Run affected Node tests and targeted Chromium scenarios, rebuild the graph
   bundle, review the diff and record commands/results and remaining limitations.

Review focus: rolled projection/render alignment; removal/reordering and growth;
gesture continuity; idle resumption after cooling; authorization failure cleanup.
Use the existing checkout and execute inline. No merge or publication requested.
