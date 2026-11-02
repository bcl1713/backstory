import { DIAGRAM_LIMITS } from './mermaid-model.js';
const NS='http://www.w3.org/2000/svg';
const TAGS=new Set(['svg','g','defs','marker','path','rect','circle','ellipse','polygon','polyline','line','text','tspan','title','desc','clipPath']);
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,100}$/;
const GEOMETRY=new Set(['x','y','dx','dy','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','markerWidth','markerHeight','refX','refY','stroke-width','opacity','stroke-dashoffset']);
// Classification runs only after the original validator rejects. No input
// name/value is returned: every branch selects an application-owned constant.
function attributeFailure(name){
  if(name==='viewBox')return 'sanitize-viewbox';
  if(name==='stroke-dasharray')return 'sanitize-numeric-list';
  if(GEOMETRY.has(name)||name==='orient')return 'sanitize-scalar';
  if(name==='points')return 'sanitize-points';
  if(name==='d')return 'sanitize-path';
  if(name==='transform')return 'sanitize-transform';
  if(['marker-start','marker-end','clip-path'].includes(name))return 'sanitize-reference';
  if(name==='fill'||name==='stroke')return 'sanitize-paint';
  if(['font-weight','font-style','text-anchor','dominant-baseline'].includes(name))return 'sanitize-text-attribute';
  if(['class','role','aria-roledescription','aria-label','aria-labelledby','aria-describedby'].includes(name))return 'sanitize-metadata';
  return 'sanitize-attribute';
}
function elementFailure(name){
  if(['filter','feDropShadow','feGaussianBlur','feOffset','feBlend','feColorMatrix','feComposite','feFlood','feMerge','feMergeNode'].includes(name))return 'sanitize-element-filter';
  if(['script','foreignObject','image','feImage','use','a','animate','animateTransform','set'].includes(name))return 'sanitize-element-resource';
  return 'sanitize-element';
}
const unsafeOutput=()=>{throw new Error('unsafe_output');};
function scalar(value,units=true){
  // Validate spelling/length before Number conversion. Library IEEE-754 decimals
  // are accepted, then serialized at stable pixel-subprecision (eight places).
  if(typeof value!=='string'||value.length>64)return null;
  const match=/^(-?(?:\d{1,7}(?:\.\d{1,32})?|\.\d{1,32}))(px|em|%)?$/.exec(value);
  if(!match||(!units&&match[2]))return null;
  const number=Number(match[1]);if(!Number.isFinite(number)||Math.abs(number)>1000000)return null;
  const rounded=number.toFixed(8).replace(/\.?0+$/,'');
  return (rounded==='-0'?'0':rounded)+(match[2]||'');
}
function numericList(value,min,max){
  const parts=value.trim().split(/[ ,]+/);if(parts.length<min||parts.length>max)return null;
  const numbers=parts.map(part=>scalar(part,false));return numbers.some(number=>number===null)?null:numbers.join(' ');
}
function canonicalGeometry(name,value){
  if(name==='viewBox')return numericList(value,4,4);
  if(name==='stroke-dasharray')return numericList(value,2,8);
  if(GEOMETRY.has(name)||name==='orient')return scalar(value);
  return null;
}
function boundedNumbers(value) { const numbers=value.match(/-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g)||[]; return numbers.length<=8000 && numbers.every(n=>Number.isFinite(Number(n))&&Math.abs(Number(n))<=1000000); }
export function safeSvgAttribute(tag,name,value,ids) {
  if(typeof value!=='string'||value.length>40000) return false;
  if(name==='id') return ID.test(value) && ids.has(value);
  if(name==='class') return /^[A-Za-z0-9_ -]{0,240}$/.test(value);
  if(['role','aria-roledescription','aria-label','aria-labelledby','aria-describedby'].includes(name)) return /^[A-Za-z0-9_ -]{1,240}$/.test(value);
  if(name==='viewBox') return canonicalGeometry(name,value)!==null;
  if(GEOMETRY.has(name)) return canonicalGeometry(name,value)!==null;
  if(name==='d') return /^[MmZzLlHhVvCcSsQqTtAa0-9eE., +\-]+$/.test(value) && boundedNumbers(value);
  if(name==='points') return /^[0-9., +\-]+$/.test(value) && boundedNumbers(value);
  if(name==='stroke-dasharray') return canonicalGeometry(name,value)!==null;
  if(name==='font-weight') return value==='normal'||value==='bold';
  if(name==='font-style') return value==='normal'||value==='italic';
  if(name==='stroke-linecap') return ['butt','round','square'].includes(value);
  if(name==='stroke-linejoin') return ['miter','round','bevel'].includes(value);
  if(name==='transform') return /^(?:(?:translate|scale|rotate|matrix)\([-0-9., ]{1,160}\)\s*)+$/.test(value) && boundedNumbers(value);
  if(name==='marker-start'||name==='marker-end'||name==='clip-path') { const m=/^url\(#([A-Za-z][A-Za-z0-9_-]{0,100})\)$/.exec(value); return !!m&&ids.has(m[1]); }
  if(name==='fill'||name==='stroke') return /^(?:none|currentColor|#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$/.test(value);
  if(name==='text-anchor') return ['start','middle','end'].includes(value);
  if(name==='dominant-baseline') return ['auto','middle','central','hanging','text-before-edge'].includes(value);
  if(name==='markerUnits') return ['strokeWidth','userSpaceOnUse'].includes(value);
  if(name==='orient') return value==='auto'||value==='auto-start-reverse'||canonicalGeometry(name,value)!==null;
  if(name==='preserveAspectRatio') return value==='xMinYMin meet'||value==='xMidYMid meet';
  if(name==='xmlns') return value===NS;
  return false;
}
// Mermaid 12.2 insertLookDefs unconditionally emits these two fixed shadows.
// They are decorative and unused after returned CSS is discarded. Validate the
// exact subtree before omission; no filter/resource element joins the allowlist.
function decorativeShadow(node,svgId){
  if(typeof svgId!=='string'||!ID.test(svgId))return false;
  if(node.localName!=='filter'||node.namespaceURI!==NS||node.parentElement?.localName!=='defs'||node.parentElement.namespaceURI!==NS)return false;
  const id=node.getAttribute('id'),small=id===svgId+'-drop-shadow-small';
  if(!small&&id!==svgId+'-drop-shadow')return false;
  const attributes=(element,expected)=>element.attributes.length===Object.keys(expected).length&&[...element.attributes].every(attr=>!attr.namespaceURI&&expected[attr.name]===attr.value);
  if(!attributes(node,{id,height:small?'150%':'130%',width:small?'150%':'130%'}))return false;
  const children=[...node.childNodes].filter(child=>!(child.nodeType===3&&/^\s*$/.test(child.textContent)));
  if(children.length!==1)return false;
  const shadow=children[0];
  return shadow.nodeType===1&&shadow.localName==='feDropShadow'&&shadow.namespaceURI===NS&&shadow.childNodes.length===0&&attributes(shadow,{dx:small?'2':'4',dy:small?'2':'4',stdDeviation:'0','flood-opacity':'0.06','flood-color':'#000000'});
}
// Final styles are application-owned, never Mermaid's returned stylesheet bytes.
const FIXED_STYLE='svg{font:16px Arial,sans-serif;color:#172033}text{fill:#172033}.node rect,.node circle,.node ellipse,.node polygon,.node path{fill:#eef2ff;stroke:#58627a;stroke-width:1.5px}.flowchart-link{fill:none;stroke:#58627a;stroke-width:1.5px}.marker{fill:#58627a;stroke:#58627a}.edgeLabel rect,.labelBkg{fill:#fff}.nodeLabel,.edgeLabel{text-anchor:middle}.node text{text-anchor:middle}';
function naturalViewport(svg,reject=unsafeOutput){
  const viewport=svg.getAttribute('viewBox')?.split(' ').map(Number);
  if(!viewport||viewport.length!==4||!viewport.every(value=>Number.isFinite(value)&&Math.abs(value)<=1000000)||viewport[2]<=0||viewport[3]<=0)reject('sanitize-viewport');
  return{width:viewport[2],height:viewport[3]};
}
export function svgViewport(svg){
  const natural=naturalViewport(svg),scale=Math.min(1,DIAGRAM_LIMITS.width/natural.width,(DIAGRAM_LIMITS.height-2)/natural.height);
  // Fit both axes with one scale. Capping height alone clips the artwork and
  // creates an unreachable inner scrollbar beneath the editor edit surface.
  // Reserve two pixels for fractional layout/viewport rounding.
  return{width:Math.max(1,natural.width*scale),height:Math.max(1,Math.min(DIAGRAM_LIMITS.height,natural.height*scale+2))};
}
export function safeSvg(svg, document, report) {
  const reject=code=>{try{report?.(code);}catch{/* Reporting cannot change rejection. */}unsafeOutput();};
  if(typeof svg!=='string'||svg.length>DIAGRAM_LIMITS.output) reject('sanitize-limit');
  let parsed;
  try{parsed=new DOMParser().parseFromString(svg,'image/svg+xml');}catch{reject('sanitize-xml');}
  if(parsed.doctype||parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg') reject('sanitize-xml');
  const elements=[parsed.documentElement,...parsed.documentElement.querySelectorAll('*')];
  if(elements.length>DIAGRAM_LIMITS.elements) reject('sanitize-limit');
  const omitted=new Set(elements.filter(node=>decorativeShadow(node,parsed.documentElement.getAttribute('id'))));
  const ids=new Set(),allIds=new Set();
  for(const node of elements) { if(node.hasAttribute('id')) { const id=node.getAttribute('id'); if(!ID.test(id)||allIds.has(id)) reject('sanitize-id'); allIds.add(id); if(!omitted.has(node))ids.add(id); } }
  let attributes=0, text=0;
  function copy(node,depth=0) {
    if(depth>32) reject('sanitize-limit');
    if(node.nodeType===3) { text+=node.textContent.length; if(text>16000) reject('sanitize-limit'); return document.createTextNode(node.textContent); }
    if(node.nodeType!==1) reject('sanitize-node');
    // Drop returned style (known fixed config) rather than trusting raw CSS.
    if(omitted.has(node)||(node.localName==='style'&&node.namespaceURI===NS)) return document.createTextNode('');
    if(node.namespaceURI!==NS) reject('sanitize-namespace');
    if(!TAGS.has(node.localName)) reject(elementFailure(node.localName));
    const clean=document.createElementNS(NS,node.localName);
    for(const attr of node.attributes) {
      if(++attributes>20000) reject('sanitize-limit');
      // Library-only bookkeeping and inline CSS are not copied into the final SVG.
      if(attr.name==='style'||attr.name.startsWith('data-')) continue;
      if(attr.name==='xmlns:xlink'&&attr.value==='http://www.w3.org/1999/xlink') continue;
      if(attr.namespaceURI&&attr.name!=='xmlns') reject('sanitize-attribute-namespace');
      if(!safeSvgAttribute(node.localName,attr.name,attr.value,ids)) reject(attributeFailure(attr.name));
      clean.setAttribute(attr.name,canonicalGeometry(attr.name,attr.value)??attr.value);
    }
    for(const child of node.childNodes) clean.append(copy(child,depth+1));
    return clean;
  }
  const clean=copy(parsed.documentElement), style=document.createElementNS(NS,'style');
  style.textContent=FIXED_STYLE; clean.prepend(style);
  const viewport=naturalViewport(clean,reject);
  clean.removeAttribute('width'); clean.removeAttribute('height');
  // A responsive maximum alone lets an intrinsic SVG fill/upscale the frame.
  // Own its natural width explicitly; shrink to available space, never enlarge.
  clean.style.width=`${viewport.width}px`; clean.style.maxWidth='100%'; clean.style.height='auto'; clean.style.display='block';
  return clean;
}
