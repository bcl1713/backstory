import { EditorView } from '@codemirror/view';

export function stickyEditorTop(document) {
  let top = 0;
  for (const overlay of document.querySelectorAll('.persistent-actions, [data-sync-banner]')) {
    if (!overlay.hidden) top = Math.max(top, overlay.getBoundingClientRect().bottom);
  }
  return top;
}

export function editorTooltipSpace(view) {
  const window = view.dom.ownerDocument.defaultView;
  const viewport = window.visualViewport;
  return { top: stickyEditorTop(view.dom.ownerDocument), left: 0,
    right: viewport?.width || window.innerWidth, bottom: viewport?.height || window.innerHeight };
}
// The editor scrolls with the page. A scrollDOM inset would also clip tooltips
// below the editor's own top, counting the sticky controls twice. Adjust page
// scrolling before CodeMirror's normal nearest-scroll handling instead.
export const stickyEditorScroll = EditorView.scrollHandler.of((view, range, options) => {
  if (options.y !== 'nearest' || range.head !== view.state.selection.main.head
      || view.scrollDOM.scrollHeight > view.scrollDOM.clientHeight + 1) return false;
  const document = view.dom.ownerDocument;
  const selection = document.getSelection();
  if (!selection?.focusNode || !view.contentDOM.contains(selection.focusNode)) return false;
  // This hook runs during CodeMirror's write phase, where coordsAtPos cannot
  // be called. The native selection has already been updated to the caret.
  const caret = document.createRange();
  caret.setStart(selection.focusNode, selection.focusOffset);
  caret.collapse(true);
  let cursor = caret.getBoundingClientRect();
  if (!cursor.height) {
    const node = selection.focusNode.nodeType === 1 ? selection.focusNode : selection.focusNode.parentElement;
    cursor = node?.closest('.cm-line')?.getBoundingClientRect();
  }
  const top = stickyEditorTop(document) + options.yMargin;
  if (cursor && cursor.top < top) document.defaultView.scrollBy(0, cursor.top - top);
  return false;
});
