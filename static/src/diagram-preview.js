import { Facet, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { getCM } from '@replit/codemirror-vim';
import { tableMotionCount, tableMotionPath } from './table-preview.js';
import { diagramModelsFromTree } from './diagram-syntax.js';
import { diagramView } from './diagram-view.js';
export const diagramEngines=Facet.define({combine:values=>values.at(-1)||['mermaid']});
export function diagramModels(state){return diagramModelsFromTree(syntaxTree(state),(from,to)=>state.doc.sliceString(from,to),state.facet(diagramEngines));}
export const revealDiagramMotion=StateEffect.define();
export const diagramMotionRange=StateField.define({create:()=>null,update(value,transaction){for(const effect of transaction.effects)if(effect.is(revealDiagramMotion))return effect.value;return value&&transaction.docChanged?{from:transaction.changes.mapPos(value.from,-1),to:transaction.changes.mapPos(value.to,1)}:value;}});
export function diagramIsActive(state,model){
  const motion=state.field(diagramMotionRange,false);
  return !!(motion&&motion.from<=model.to&&motion.to>=model.from)||state.selection.ranges.some(range=>range.from<=state.doc.lineAt(model.to).to&&range.to>=state.doc.lineAt(model.from).from);
}
class DiagramWidget extends WidgetType{
  constructor(model){super();this.model=model;}
  eq(other){return this.model.from===other.model.from&&this.model.source===other.model.source;}
  toDOM(view){
    const wrapper=view.dom.ownerDocument.createElement('div');wrapper.contentEditable='false';
    const valid=()=>!wrapper.diagramDisposed&&view.state.doc.sliceString(this.model.from,this.model.to)===this.model.source&&!diagramIsActive(view.state,this.model);
    wrapper.disposeDiagram=diagramView(wrapper,this.model,{valid,onSource:()=>{view.dispatch({selection:{anchor:this.model.from},scrollIntoView:true});view.focus();},measured:()=>{if(!wrapper.diagramDisposed&&wrapper.isConnected)view.requestMeasure();}});
    return wrapper;
  }
  destroy(dom){dom.diagramDisposed=true;dom.disposeDiagram?.();}
  ignoreEvent(){return true;}
}
export function diagramDecorations(state){return Decoration.set(diagramModels(state).filter(model=>!diagramIsActive(state,model)).map(model=>Decoration.replace({block:true,widget:new DiagramWidget(model)}).range(model.from,model.to)),true);}
const keyboard=ViewPlugin.fromClass(class{constructor(){this.generation=0;this.destroyed=false;}destroy(){this.destroyed=true;}},{eventObservers:{keydown(event,view){
  if(event.defaultPrevented||event.isComposing||event.altKey||event.metaKey||event.ctrlKey)return;
  const vim=getCM(view)?.state.vim,normal=vim&&!vim.insertMode;
  const direction=event.key==='ArrowDown'||(normal&&event.key==='j')?1:event.key==='ArrowUp'||(normal&&event.key==='k')?-1:0;if(!direction)return;
  const path=tableMotionPath(view.state,direction,normal?tableMotionCount(vim.inputState):1);let hidden=false;
  view.state.field(diagramPreview).between(path.from,path.to,()=>{hidden=true;});if(!hidden)return;
  const generation=++this.generation;view.dispatch({effects:revealDiagramMotion.of(path)});
  queueMicrotask(()=>{if(!this.destroyed&&this.generation===generation)view.dispatch({effects:revealDiagramMotion.of(null)});});
}}});
export const diagramPreview=StateField.define({create:diagramDecorations,update(value,transaction){return transaction.docChanged||transaction.selection||transaction.effects.some(effect=>effect.is(revealDiagramMotion))||syntaxTree(transaction.startState)!==syntaxTree(transaction.state)?diagramDecorations(transaction.state):value;},provide:field=>[diagramMotionRange,keyboard,EditorView.decorations.from(field)]});
