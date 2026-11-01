# Upward navigation below rendered previews (#81)

Reproduce with real Vim `k` and ArrowUp from 3, 7 and 13 lines below
rendered elements at desktop and phone widths, attaching DOM coordinates and
CodeMirror height-map targets. Compare the table correction from #42.

The corrected isolated matrix passes for tables, images, inline math and display
math. Mermaid, Graphviz and Vega-Lite fail in both modes: for example Vega-Lite
Vim from line 25 lands on line 9 instead of 24. Their common `.lp-diagram` outer
margins add 24px outside the bounding rectangle consumed by CodeMirror's
`measureVisibleLineHeights`. The resulting height-map mismatch affects subsequent
content, including other preview families in mixed notes. No key handler or
renderer security change is needed.

Move diagram vertical spacing inside the measured box in the editor only,
following the table fix. Keep standalone server preview styling unchanged.
Verify the regression and mixed-note cases, source fidelity, repeated navigation,
source reveal, count/operator motions and existing direct-edit/modal behavior.
Inspect desktop and mobile screenshots. Run Python, Node, build and browser
checks, obtain independent review, then publish a draft PR for parent merge.

Base includes toolbar PR80 at 596375762ba637563795a3634c190c5ea9f9b789.

Evidence: corrected isolated baseline had 6 real motion failures (all three
engines, both modes) and 8 passing controls. Separate mixed-note baseline failed
both modes. With the scoped CSS fix, all 16 regressions pass, including repeated
source reveal, count/delete/undo and exact source checks. Build and 230 Node tests
pass. Actual Mermaid phone, Graphviz desktop and Vega-Lite phone screenshots
were inspected; final broader checks and independent review follow.
