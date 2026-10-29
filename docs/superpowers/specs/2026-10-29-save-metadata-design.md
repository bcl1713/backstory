# Save metadata

Approved October 29: wiki dates always use Omaha (`America/Chicago`), date only.
Central server-side save preparation covers manual saves, autosave, and WebMCP.
Existing top-level `modified` is updated; older notes without that field are not
retrofitted. First saves of new notes add missing `created` and `modified`; a
missing `id` is derived in kebab case from an existing title and remains stable.
A genuine title change appends the previous human-readable title to aliases,
without duplicates or replacing provided aliases. Filename moves are not titles.

Use bounded YAML node positions for surgical edits rather than serializing all
metadata. Preserve unrelated values, comments and styles; the existing formatter
still applies its usual configured transformations. No background rewriting.
Explicit source recovery and revision restoration retain their exact semantics.
No metadata modification on failed/conflicting saves. Return authoritative saved
source/hash including metadata changes. Same-day repeated saves become no-ops.

Client-side stamping was rejected because tools and browser saves could differ;
rewriting the formatter was rejected because metadata is a save concern.
