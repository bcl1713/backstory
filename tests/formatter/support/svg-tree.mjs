// Minimal native-DOM interface adapter: tests exercise production reconstruction,
// not XML parsing or browser layout. Real XML/browser coverage remains in CI.
const NS='http://www.w3.org/2000/svg';
export class Element {
  nodeType=1;
  constructor(name,attributes={},children=[],namespace=NS){this.localName=name;this.namespaceURI=namespace;this.attributes=[];this.childNodes=[];this.style={};for(const [key,value]of Object.entries(attributes))this.setAttribute(key,value);this.append(...children);}
  setAttribute(name,value){this.removeAttribute(name);this.attributes.push({name,value:String(value),namespaceURI:name.startsWith('xmlns')?'http://www.w3.org/2000/xmlns/':null});}
  removeAttribute(name){this.attributes=this.attributes.filter(attr=>attr.name!==name);}
  getAttribute(name){return this.attributes.find(attr=>attr.name===name)?.value??null;}
  hasAttribute(name){return this.attributes.some(attr=>attr.name===name);}
  append(...children){for(const child of children){child.parentElement=this;this.childNodes.push(child);}}
  prepend(child){child.parentElement=this;this.childNodes.unshift(child);}
  querySelectorAll(){return this.childNodes.flatMap(child=>child.nodeType===1?[child,...child.querySelectorAll('*')]:[]);}
  set textContent(value){this.text=String(value);this.childNodes=[];}
  get textContent(){return this.text??this.childNodes.map(child=>child.textContent).join('');}
}
export const document={createElementNS:(namespace,name)=>new Element(name,{},[],namespace),createTextNode:text=>({nodeType:3,textContent:String(text)})};
export function withParsedSvg(root,callback){const original=globalThis.DOMParser;globalThis.DOMParser=class{parseFromString(){return{doctype:null,documentElement:root,querySelector:()=>null};}};try{return callback();}finally{if(original===undefined)delete globalThis.DOMParser;else globalThis.DOMParser=original;}}
