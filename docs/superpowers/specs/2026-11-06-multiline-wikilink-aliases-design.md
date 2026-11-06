# Multiline wikilink aliases

Issue: https://github.com/bcl1713/backstory/issues/95

Explicit formatted saves must accept wrapped aliases in prose, unordered,
ordered, nested, task and quoted lists, preserving targets and label text.
Prettier currently treats a multiline alias as raw paragraph text and adds
list indentation again on every pass. This is reproducible with the pinned
Prettier; `proseWrap` alone does not resolve it.

Normalize a complete wrapped `[[target|label]]` to one physical line before
Prettier runs. Replace the alias's soft line breaks and adjacent indentation
with one space; retain other label whitespace, punctuation, escapes and the
literal target. Use the existing Lezer Markdown parser with a formatter-only
inline rule to distinguish actual text from code, escaped openers, front
matter, raw HTML, links/images and mathematical source. Container quote marks
are syntax, not label text. Ordinary preview grammar stays single-line.

Alternatives: accepting a later pipeline pass would weaken the exact fixed-point
guard; disabling prose wrapping does not fix the reproduced growth; wrapping
Prettier's private AST/printer internals would couple the fix to upstream
implementation details. A bounded parser-based normalization is the chosen
implementation decision under the user's end-to-end authorization.

Keep the exact two-pass comparison, original-source-on-failure behavior,
configuration/ignore semantics, worker budgets, guarded saves and rendering
policy. The backend preservation parser recognizes wrapped aliases only for
destination comparison, so normalization passes while target changes fail. No background migration, bulk rewrite, timeout changes or deployment.
Use synthetic formatter and save/readback/rendering regressions, independent
review and the complete local release gate before merging into dev. Publish
through the existing dev publisher and verify the released source and images.
