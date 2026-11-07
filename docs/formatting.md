# Formatting drafts

Authenticated `POST /format/<wiki-relative-note.md>` accepts a JSON object with
`source`. It returns `source`, `diagnostics`, `diff`, `outcome`, and
`config_digest`. CSRF protection applies. Formatting never writes a wiki note;
opening a note and requesting its preview never invoke the formatter.

The packaged pipeline is Prettier, markdownlint-cli2 supported fixes, Prettier,
and lint diagnostics. The same pipeline runs again and must produce exactly the
same bytes. Non-fixable lint warnings remain visible and permit acceptance.
Failures return the submitted source; a preservation conflict also includes the
proposed diff. Normal formatting can change whitespace and newline conventions.
An existing BOM is retained. The note reader represents an on-disk BOM separately
from editable source, so save callers must retain `NoteSnapshot.bom` when encoding.

## Optional data configuration

Only configuration in the note's directory ancestry and explicit local data
references is snapshotted. Supported names are:

- `.prettierrc`, `.prettierrc.json`, `.prettierrc.jsonc`, `.prettierrc.yaml`,
  `.prettierrc.yml`;
- `.markdownlint.json`, `.markdownlint.jsonc`, `.markdownlint.yaml`,
  `.markdownlint.yml`;
- `.markdownlint-cli2.jsonc`, `.markdownlint-cli2.yaml`,
  `.markdownlint-cli2.yml`;
- `.prettierignore`, `.markdownlintignore`, `.gitignore`, and `.editorconfig`.

JSONC permits comments and trailing commas. Extensionless `.prettierrc` also
permits YAML. JSON5, JavaScript, TypeScript, package configurations, plugins,
custom rules, parser overrides, module paths, arbitrary front-matter regexes,
and custom output formatters are rejected. Duplicate keys, unsupported YAML
tags, alias cycles, and unsafe object keys are rejected.

`extends` accepts an explicit `./` or `../` relative path, or an array of such
paths. markdownlint-cli2 also accepts one relative `configFile`. References must
normalize inside the wiki, point to JSON/JSONC/YAML data or `.prettierrc`, and
pass the filesystem deny policy. Sensitive files and symlinks are denied.
References inherit data before the declaring file's own options. Executable
configuration candidates are detected and cause failure, and known formatter
configurations cannot be served through content routes.

Prettier accepts bounded scalar formatting options and `overrides` with `files`,
`excludeFiles`, and scalar `options`. The nearest configuration wins. No config
uses the application defaults `printWidth: 80`, `proseWrap: always`, and
`endOfLine: auto`. A present configuration uses its own options and tool defaults.
EditorConfig contributes `end_of_line`, `indent_style`, `indent_size`,
`tab_width`, and `max_line_length`; Prettier configuration takes precedence.

markdownlint configurations accept built-in rule settings. Supported cli2 data
directives are `config`, `configFile`, `fix`, `gitignore`, `globs`, `ignores`,
`noInlineConfig`, `noBanner`, `noProgress`, `showFound`, and `overrides`.
Overrides contain `filter`, `combine` (`merge` or `replace`), and built-in
`config`. Application code controls fixes and diagnostic output. `globs` are
validated but never enumerate notes. When all markdownlint configs are absent,
MD013 is disabled; an existing configuration takes precedence.

Each tool's ignores apply independently. Prettier respects the approved root
`.gitignore` and applicable `.prettierignore` files. Configured markdownlint `gitignore`
accepts true or a pattern selecting approved ancestor `.gitignore` files.
Ignored notes remain editable and receive tool-specific skip diagnostics.

## Safety limits

Configuration files are confined regular files, at most 64 KiB each, with at
most 32 present files, eight reference levels, and sixteen directory ancestors.
Both file bytes and absent candidates are rechecked before accepting a result.
Changed configuration fails acceptance. No wiki root, other note, or live
configuration path is supplied to Node; only approved text crosses the boundary.
The helper stages one note in a private directory under application data storage
and uses packaged modules. Its stdin file and Node scratch stay in that directory
and are removed after the request.

The helper has a ten-second total budget, 256 MiB Node heap, 8 MiB output cap,
and 200 diagnostics. Front matter has a 256 KiB UTF-8 cap, collection depth 32,
at most 50 alias references, and a bounded node projection. YAML parsing composes
nodes without constructors or timestamp inference. Typed scalar tags, nested
values, unknown keys, and parsed Markdown/image/wikilink destinations are
compared before acceptance. The projection is never serialized into note source.

## Save-time note metadata

Normal Backstory saves (manual, autosave and WebMCP) maintain note metadata in
one server-side step before formatting. Calendar dates use the persisted **wiki timezone**, regardless of the browser's
current travel timezone. An explicit `BACKSTORY_WIKI_TIMEZONE` deployment setting
(overriding the saved zone) can keep an Omaha wiki on `America/Chicago`.
See [Wiki timezone setup](setup.md#wiki-timezone).

- Existing `modified` fields become a date-only `YYYY-MM-DD` value. Existing
  notes without that field or without front matter are not retrofitted.
- The first save of a new file adds missing `created` and `modified` fields.
  A missing `id` is generated in kebab case from the explicit title, or the
  first Markdown heading used as the note's display title. No filename-derived
  ID is invented when there is no title. Supplied IDs and creation dates stay.
- When the display title genuinely changes, the previous title is appended to
  `aliases` (or existing `alias`) without duplicating an existing value. IDs
  stay stable. Moving a file alone does not rename its title or change aliases.
- Unrelated YAML values, body text and comments are not rewritten by this step;
  the configured formatter still applies its normal formatting policy.
- Unusual automatic-field shapes or anchor references are rejected safely with
  a diagnostic rather than modifying another field. Correct the field, or use
  the existing explicit source-recovery workflow when appropriate.

Format-only previews do not stamp dates. Explicit source recovery and revision
restoration preserve their original exact-source behavior. Conflict/failed saves
publish no metadata. The returned source and revision describe the actual saved
bytes, including metadata; repeat same-day saves can remain no-ops.
