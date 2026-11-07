# Rich rendering

Issue #66 is the complete product specification: https://github.com/bcl1713/backstory/issues/66 .

Required stages are local raster image display in the main live editor, explicit Mermaid fenced diagrams, and inline/display mathematical notation. Source remains authoritative. Local images reuse existing authenticated attachment routing and exclusions. Renderer dependencies must be pinned, self-hosted and lazy-loaded; no note-controlled remote fetches, executable code, trust escalation or global CSP weakening. Unsupported or over-budget inputs remain editable source with safe diagnostics.

The owner requested implementation after issue filing. Deliver independent reviewed increments; do not add optional Graphviz/Vega/chart engines in this pass. Separate server preview should have consistent behavior or explicit documented limits. No deployment is authorized.

Math uses explicit `\(...\)` and `\[...\]` plus block `$$` delimiters initially. Dollar-inline support requires safe currency rules and is not assumed. Mermaid uses strict mode, application-owned secure settings and bounded graph/text work. Ordinary code remains inert. Generated SVG and math markup require narrowly reviewed sanitization/CSP integration, not a general raw HTML or SVG allowance.

Images should be responsive, lazy, accessible and enlargable without mutating source. Rendered widgets must preserve editor navigation, focus, selections, undo and source-mode switches. If a compatibility choice would change source syntax, security or scope, stop and reconcile before implementing it.

## Approved scoped renderer exception and acceptance status

The owner approved a dedicated authenticated `/renderers/mermaid-frame/` shell:
only successful exact named-route GET HTML responses remove XFO, use the exact
validated canonical parent origin for frame-ancestors, an opaque allow-scripts
sandbox, nonce-authorized local classic bundle and frame-only inline styles.
Other routes, parent/preview policy, authentication, CSRF, attachments and source
HTML escaping remain unchanged. This is not a global CSP exception, arbitrary
compromised-JavaScript network firewall or hard CPU/memory sandbox. No production
origin value or deployment is authorized here.

Initial Mermaid support is the positively validated bounded flowchart subset in
`docs/mermaid-frame.md`, not all Mermaid engines. Editor and inert server-preview
hydration share at most two visible frame contexts, explicit capacity/paused
source fallback and source-reveal controls. Full-source formatter signatures are
independent of presentation limits. Actual combined browser/visual/performance
acceptance and release review remain open until CI evidence is established.
