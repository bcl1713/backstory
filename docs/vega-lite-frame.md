# Static inline-data charts

Issue #74 supports explicit top-level `vega-lite` fences after a separate operator opt-in. The initial families are bar, line and point. This is a constrained subset, not arbitrary Vega-Lite or full Vega. Click/tap a chart or use its keyboard source control to edit the unchanged JSON; move the caret away to render again. Rendering never saves or reformats a note. Unsupported, malformed, over-budget or failed charts retain readable source, including raw/server/no-JS views.

```vega-lite
{
  "data": {"values": [
    {"category": "A", "value": 2},
    {"category": "B", "value": 4},
    {"category": "C", "value": 3}
  ]},
  "mark": "bar",
  "encoding": {
    "x": {"field": "category", "type": "nominal"},
    "y": {"field": "value", "type": "quantitative"}
  }
}
```

Only the three top-level keys shown above are accepted. Records must share the same fields. Each x/y encoding requires a field and explicit nominal/quantitative type; at least one axis is quantitative. An optional color encoding supports nominal grouping. Nominal fields contain nonempty strings, quantitative fields finite numbers. Field names are ASCII identifiers, at most 32 units; prototype-sensitive names are rejected and all fields are remapped to owned names before compilation. Original field names become inert axis titles. No supplied schema URL, data URL, image, hyperlink, action, expression, transform, parameter, selection, custom scale/axis/configuration, layer, facet, concatenation or raw Vega runtime is accepted. URL-looking text in a record is only text, never a resource reference.

Limits: 65536 UTF-8 source and canonical transport bytes, JSON depth 8, 256 records, 8 fields, 80-unit strings, 32 distinct nominal categories per encoding and absolute numeric values ≤ 1e9. Source validation runs before frame allocation and again inside the worker. Unknown keys/types reject the whole chart. Source JSON is not forwarded unrestricted: only the reconstructed model reaches the compiler. Vega's dataflow gets a fresh mutable copy so tuple identities cannot mutate the frozen validated model or discard records.

Graphviz and Vega-Lite share a two-frame budget and one executing worker. Mermaid retains its separate two-frame limit. Each worker has a 2000 ms deadline including startup; it is terminated and its blob URL revoked on completion, error, timeout, staleness or disposal. Output is limited to 250000 units and 4000 elements before transfer; child rebuilding additionally bounds 20000 attributes, 16000 text units, depth 32 and a 1600×1200 viewport. Only bounded SVG geometry, text, owned local references and inert accessibility metadata survive. No generated SVG enters parent HTML.

## Interpreter and policy

Pinned local packages: Vega 6.4.0, Vega-Lite 6.5.0 and vega-interpreter 2.3.2. The official interpreter processes compiler-generated expression ASTs; user expressions are prohibited. The build replaces the audited default runtime expression backend with the official interpreter and rejects Function construction, dynamic imports and WASM in the worker output. Unused CSV parsing is replaced with a denying stub; only inline records are supported. A denying loader is supplied at View construction and network/import/nested-worker APIs are disabled independently of CSP. Headless SVG export occurs inside the worker; there is no parent/main-thread or eval fallback. Dependency notices are distributed in `static/licenses/vega-lite/`.

`BACKSTORY_VEGA_LITE_PARENT_ORIGIN` defaults empty/disabled. It is one canonical browser-facing origin matching existing allowed hosts and the actual validated request origin, under the same canonical-origin rules documented for Graphviz. Mermaid and Graphviz opt-ins do not enable it. Distributed base/Portainer/Cloudflare manifests pass it through with empty defaults. No production setting or deployment is supplied.

Only an authenticated active-session successful exact GET of `/renderers/vega-lite-frame/`, with no query and an engine-specific response type, receives the approved framing exception. Other routes, errors and redirects keep framing denial. The shell uses nonce-only scripts, frame-local inline styles, exact frame-ancestors, `sandbox allow-scripts` without same-origin and `worker-src blob:`. All connect/image/font/media/object/nested-frame destinations stay denied. Unlike Graphviz, **Vega-Lite has no WebAssembly permission**; neither renderer permits JavaScript eval. Parent/editor and Mermaid policy remain unchanged.

Residual risks: local compiler/runtime and browser bugs remain possible. CSP allows blob workers generally inside this shell; application code enforces intended concurrency. A deadline and input/output bounds are not a hard heap quota or real-time guarantee. Slow devices may retain source. Expanding chart families, transforms, resources or runtime authority requires a separate review.
