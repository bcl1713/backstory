# Complete bounded diagram viewports (#83)

Synthetic 18-stage Mermaid and Graphviz diagrams reproduce clipping in editor
and standalone preview at phone and desktop widths. The shared viewport helper
limits width proportionally but caps height independently: a 168×1604 SVG is
reported as 168×1200. The child retains its full-height SVG in a scrollable main.
Editor frames intentionally ignore pointer events for parent-owned source editing,
so that inner scrollbar is unreachable there. The following note content starts
after the clipped frame. The adjacent-line keyboard lifetime issue is unrelated.

Use one scale constrained by both existing width and height limits, with the
existing 2px rounding allowance. Preserve the complete SVG, source and sandbox;
no new resource limits, capabilities, message fields or event handlers. Very tall
diagrams become smaller, so document the readability tradeoff.

Red evidence: four real browser failures (Mermaid/Graphviz × editor/preview),
with Vega-Lite controls passing; unit test also failed on independently capped
height. Green coverage checks complete SVG and last label bounds, no internal
scroll overflow, repeated mobile/desktop resize without replacement, source
fidelity and direct source activation. Capture the visible bottom after real
page scrolling; full-page screenshots can recycle virtualized editor widgets.
Run all Python/Node/build checks, broader rendering and navigation browser tests,
independent exact-head review, full CI, then merge dev and verify publication.
