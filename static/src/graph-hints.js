// Assign once on entry. Movement and streamed topology never retarget a code.
const KEYS = 'asdfghjkl';
export function hintAssignments({nodes, edges, selected, projected, width, height}) {
  const outbound = new Set(edges.filter(e => e.source === selected).map(e => e.destination));
  const visible = nodes.filter(n => { const p=projected.get(n.path); return p?.visible && p.x>=0 && p.x<=width && p.y>=0 && p.y<=height; });
  visible.sort((a,b) => Number(outbound.has(b.path))-Number(outbound.has(a.path)) || a.path.localeCompare(b.path));
  if (!visible.length) return [];
  const levels = [[], [...KEYS]];
  let count=KEYS.length, shortest=1;
  // Split shortest leaves with a queue of levels. Work grows with visible
  // targets, rather than rescanning the entire code set for every split.
  while(count < visible.length) {
    if(!levels[shortest].length){shortest++;continue;}
    const parent=levels[shortest].pop();
    (levels[shortest+1] ||= []).push(...[...KEYS].map(key=>parent+key));
    count += KEYS.length-1;
  }
  const codes=levels.flat();
  codes.sort((a,b)=>a.length-b.length || [...a].reduce((order,key,i)=>order || KEYS.indexOf(key)-KEYS.indexOf(b[i]),0));
  return visible.map((node,i)=>({path:node.path,title:node.title,code:codes[i]}));
}
export class GraphHints {
  constructor(){this.assignments=[];this.active=false;this.prefix='';}
  begin(options){this.assignments=hintAssignments(options);this.active=this.assignments.length>0;this.prefix='';}
  cancel(){this.active=false;this.assignments=[];this.prefix='';}
  key(key){
    if(!this.active)return {};
    if(key==='Escape'){this.cancel();return {cancelled:true};}
    if(key==='Backspace'){this.prefix=this.prefix.slice(0,-1);return {};}
    if(key.length!==1 || !KEYS.includes(key.toLowerCase()))return {invalid:true};
    const next=this.prefix+key.toLowerCase();
    if(!this.assignments.some(h=>h.code.startsWith(next)))return {invalid:true};
    this.prefix=next;
    const chosen=this.assignments.find(h=>h.code===next);
    if(chosen){this.cancel();return {path:chosen.path};}
    return {};
  }
}
