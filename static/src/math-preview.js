import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { getCM } from '@replit/codemirror-vim';
import { tableMotionCount, tableMotionPath } from './table-preview.js';
import { mountMath } from './math-loading.js';
import { bindSourceEdit } from './preview-source-edit.js';

import { mathModelsFromTree } from './math-syntax.js';
export { mathSyntax } from './math-syntax.js';

export function mathModels(state) {
  return mathModelsFromTree(syntaxTree(state), (from, to) => state.doc.sliceString(from, to));
}
export const revealMathMotion = StateEffect.define();
export const mathMotionRange = StateField.define({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) if (effect.is(revealMathMotion)) return effect.value;
    return value && transaction.docChanged ? { from: transaction.changes.mapPos(value.from, -1), to: transaction.changes.mapPos(value.to, 1) } : value;
  },
});
export function mathIsActive(state, model) {
  const motion = state.field(mathMotionRange, false);
  return !!(motion && motion.from <= model.to && motion.to >= model.from)
    || state.selection.ranges.some(range => range.from <= state.doc.lineAt(model.to).to && range.to >= state.doc.lineAt(model.from).from);
}
class MathWidget extends WidgetType {
  constructor(model) { super(); this.model = model; }
  eq(other) { return this.model.source === other.model.source && this.model.from === other.model.from; }
  toDOM(view) {
    const doc = view.dom.ownerDocument;
    const wrapper = doc.createElement(this.model.display ? 'div' : 'span');
    wrapper.className = this.model.display ? 'lp-math lp-math-display' : 'lp-math';
    wrapper.contentEditable = 'false';
    const output = doc.createElement('span');
    const source = doc.createElement('code');
    source.textContent = this.model.source;
    output.appendChild(source);
    wrapper.append(output);
    const valid = () => !wrapper.mathDisposed && wrapper.isConnected && view.state.doc.sliceString(this.model.from, this.model.to) === this.model.source && !mathIsActive(view.state, this.model);
    bindSourceEdit(wrapper, { label: 'Edit math source', valid,
      activate: () => { view.dispatch({ selection: { anchor: this.model.from }, scrollIntoView: true }); view.focus(); } });
    mountMath(output, this.model, valid, () => { if (valid()) view.requestMeasure(); });
    return wrapper;
  }
  destroy(dom) { dom.mathDisposed = true; }
  ignoreEvent() { return true; }
}
export function mathDecorations(state) {
  return Decoration.set(mathModels(state).filter(model => !mathIsActive(state, model)).map(model =>
    Decoration.replace({ block: model.display, widget: new MathWidget(model) }).range(model.from, model.to)), true);
}
const mathKeyboard = ViewPlugin.fromClass(class {
  constructor() { this.generation = 0; this.destroyed = false; }
  destroy() { this.destroyed = true; }
}, { eventObservers: { keydown(event, view) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
  const vim = getCM(view)?.state.vim;
  const vimMotion = vim && !vim.insertMode;
  const direction = event.key === 'ArrowDown' || (vimMotion && event.key === 'j') ? 1 : event.key === 'ArrowUp' || (vimMotion && event.key === 'k') ? -1 : 0;
  if (!direction) return;
  const path = tableMotionPath(view.state, direction, vimMotion ? tableMotionCount(vim.inputState) : 1);
  let hidden = false;
  view.state.field(mathPreview).between(path.from, path.to, () => { hidden = true; });
  if (!hidden) return;
  const generation = ++this.generation;
  view.dispatch({ effects: revealMathMotion.of(path) });
  queueMicrotask(() => { if (!this.destroyed && this.generation === generation) view.dispatch({ effects: revealMathMotion.of(null) }); });
} } });
export const mathPreview = StateField.define({
  create: mathDecorations,
  update(value, transaction) {
    return transaction.docChanged || transaction.selection || transaction.effects.some(effect => effect.is(revealMathMotion)) || syntaxTree(transaction.startState) !== syntaxTree(transaction.state)
      ? mathDecorations(transaction.state) : value;
  },
  provide: field => [mathMotionRange, mathKeyboard, EditorView.decorations.from(field)],
});
