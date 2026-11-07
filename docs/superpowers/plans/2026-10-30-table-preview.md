# Table preview implementation plan

Goal: Render inactive GFM tables in the existing 80ch column; reveal the whole source table for caret or range editing.
Architecture: A dedicated CodeMirror StateField supplies block replacements. Lezer syntax nodes supply cells and inline formatting; DOM construction never interprets HTML. Existing raw-source editor, formatting and Vim own editing unchanged.
Tech: CodeMirror 6, Lezer Markdown, Playwright.
Approved spec: Brian selected the 80ch wrapped-cell concept using 27-02; quiet horizontal dividers, no new toolbar or spreadsheet UI.

- [ ] Browser test fails for inactive semantic table and source reveal without source mutation.
- [ ] Implement table state-field widget with safe inline text/formatting, whole-table selection handling and scoped width/wrapping CSS.
- [ ] Add tests for arrows, cross-table selections, undo/mode changes, escaped pipes/code/HTML/links and narrow widths.
- [ ] Run formatter, Python and browser suites; inspect real fixture screenshots.
- [ ] Independent review; resolve findings; draft PR only.

Review focus: async syntax parse changes; selection boundary behavior; wide unbroken content; HTML/image safety; mixed newline/source bytes. No production wiki edits. Existing table link navigation/completion limitations remain documented.
