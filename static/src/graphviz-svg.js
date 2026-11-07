import {safeSvgAttribute,svgViewport} from './mermaid-svg.js';
const NS='http://www.w3.org/2000/svg';
const TAGS=new Set(['svg','g','path','polygon','polyline','ellipse','circle','rect','line','text','title','desc']);
export function graphvizSvg(source,doc){
  if(typeof source!=='string'||source.length>250000)throw new Error('unsafe_output');
  // Graphviz's fixed XML preamble is not part of the accepted output DOM.
  source=source.replace(/^<\?xml version="1\.0" encoding="UTF-8" standalone="no"\?>\s*/, '').replace(/^<!DOCTYPE svg PUBLIC "-\/\/W3C\/\/DTD SVG 1\.1\/\/EN"\s+"http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd">\s*/, '');
  const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
  if(parsed.doctype||parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg')throw new Error('unsafe_output');
  const elements=[parsed.documentElement,...parsed.documentElement.querySelectorAll('*')];
  if(elements.length>4000)throw new Error('unsafe_output');
  const ids=new Set();let text=0,attributes=0;
  for(const el of elements){const id=el.getAttribute('id');if(id){if(ids.has(id)||!/^[A-Za-z][A-Za-z0-9_-]{0,100}$/.test(id))throw new Error('unsafe_output');ids.add(id);}}
  function copy(node,depth=0){
    if(depth>32)throw new Error('unsafe_output');
    if(node.nodeType===8)return doc.createTextNode(''); // fixed engine comments, never markup
    if(node.nodeType===3){text+=node.textContent.length;if(text>16000)throw new Error('unsafe_output');return doc.createTextNode(node.textContent);}
    if(node.nodeType!==1||node.namespaceURI!==NS||!TAGS.has(node.localName))throw new Error('unsafe_output');
    const clean=doc.createElementNS(NS,node.localName);
    for(const attr of node.attributes){
      if(++attributes>20000)throw new Error('unsafe_output');
      if(attr.name==='xmlns:xlink'&&attr.value==='http://www.w3.org/1999/xlink')continue;
      if(attr.name==='xml:space'&&attr.namespaceURI==='http://www.w3.org/XML/1998/namespace'&&attr.value==='preserve')continue;
      if(attr.namespaceURI&&attr.name!=='xmlns')throw new Error('unsafe_output');
      if(node===parsed.documentElement&&['width','height'].includes(attr.name))continue;
      if(attr.name==='font-family'){clean.setAttribute('font-family','Arial, sans-serif');continue;}
      if(attr.name==='font-size'){if(!/^\d{1,2}(?:\.\d{1,4})?$/.test(attr.value)||Number(attr.value)>32)throw new Error('unsafe_output');clean.setAttribute(attr.name,attr.value);continue;}
      if(!safeSvgAttribute(node.localName,attr.name,attr.value,ids))throw new Error('unsafe_output');
      clean.setAttribute(attr.name,attr.value);
    }
    for(const child of node.childNodes)clean.append(copy(child,depth+1));return clean;
  }
  const clean=copy(parsed.documentElement);svgViewport(clean);
  clean.style.width=clean.getAttribute('viewBox').split(/\s+/)[2]+'px';clean.style.maxWidth='100%';clean.style.height='auto';clean.style.display='block';
  return clean;
}
