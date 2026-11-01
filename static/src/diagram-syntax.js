import { parser, GFM } from '@lezer/markdown';
import { frontMatter } from './markdown-front-matter.js';
import { DIAGRAM_LIMITS, parseFlowchart } from './mermaid-model.js';
import {parseDot} from './graphviz-model.js';
import {parseVegaLite} from './vega-lite-model.js';
const excluded=new Set(['FrontMatter','HTMLBlock','CodeBlock','InlineCode']);
function fence(node,slice,exact=true){
  if(node.name!=='FencedCode')return null;
  const info=node.getChild('CodeInfo');
  if(!info)return null;
  const language=slice(info.from,info.to).trim();
  if(exact?!['mermaid','graphviz','dot','vega-lite'].includes(language):!/^(?:mermaid|graphviz|dot|vega-lite)(?:[ \t]|$)/i.test(language))return null;
  return slice(node.from,node.to);
}
export function diagramModelsFromTree(tree,slice,engines=['mermaid']){
  const models=[],cursor=tree.cursor();
  for(let visited=0;visited<100000;visited++){
    let descend=!excluded.has(cursor.name);
    if(cursor.name==='FencedCode'){
      descend=false;
      if(cursor.node.parent?.name==='Document'){
        const source=fence(cursor.node,slice),marks=cursor.node.getChildren('CodeMark');
        const language=cursor.node.getChild('CodeInfo');
        const name=language&&slice(language.from,language.to).trim();
        const engine=name==='dot'?'graphviz':name;
        const limit=engine==='vega-lite'?65536:DIAGRAM_LIMITS.source;
        if(source&&engines.includes(engine)&&source.length<=limit+100&&marks.length===2&&/^(?:`{3,}|~{3,})[ \t]*(?:mermaid|graphviz|dot|vega-lite)[ \t]*\n/.test(source)){
          const start=source.indexOf('\n')+1,last=source.lastIndexOf('\n');
          const expression=source.slice(start,last+1);
          if(expression.length<=limit){
            let supported=true;try{(engine==='mermaid'?parseFlowchart:engine==='graphviz'?parseDot:parseVegaLite)(expression);}catch{supported=false;}
            models.push({from:cursor.from,to:cursor.to,source,expression,supported,engine});
            if(models.length===32)break;
          }
        }
      }
    }
    if(visited===99999||!cursor.next(descend))break;
  }
  return models;
}
let sourceParser;
export function diagramSources(source){
  const normalized=source.replace(/\r\n?|\n/g,'\n');
  sourceParser ||= parser.configure([GFM,frontMatter]);
  const cursor=sourceParser.parse(normalized).cursor(),signatures=[];
  for(let visited=0;visited<100000;visited++){
    let descend=!excluded.has(cursor.name);
    if(cursor.name==='FencedCode'){const source=fence(cursor.node,(from,to)=>normalized.slice(from,to),false);if(source!==null)signatures.push(source);descend=false;}
    if(visited===99999)return null;
    if(!cursor.next(descend))return signatures;
  }
  return null;
}
