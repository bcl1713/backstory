import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { ensureSyntaxTree } from '@codemirror/language';

// Headless syntax assertions have no EditorView to finish an initial partial parse.
export function parsedState(config) {
  const state = EditorState.create(config);
  assert.ok(ensureSyntaxTree(state, state.doc.length, 1000), 'complete the fixture Markdown parse');
  // ensureSyntaxTree advances the parse context; a transaction attaches its tree
  // to the returned state and refreshes syntax-dependent preview fields.
  return state.update({}).state;
}
