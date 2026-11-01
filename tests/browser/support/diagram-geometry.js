import {expect} from '@playwright/test';

// Test-only access to the opaque child; application code never reads its DOM.
export async function expectDiagramGeometry(iframe){
 const frame=await(await iframe.elementHandle()).contentFrame();
 const metrics=await frame.evaluate(()=>{
  const svg=document.querySelector('#diagram > svg'),box=svg.getBoundingClientRect(),natural=svg.viewBox.baseVal;
  return{width:box.width,height:box.height,naturalWidth:natural.width,naturalHeight:natural.height,viewportWidth:innerWidth,viewportHeight:innerHeight,right:box.right,bottom:box.bottom,nodes:[...svg.querySelectorAll('g.node')].map(node=>{
   const text=node.querySelector('.label text'),shape=node.querySelector(':scope > rect,:scope > circle,:scope > ellipse,:scope > polygon,:scope > path');
   if(!text||!shape)return null;const t=text.getBoundingClientRect(),s=shape.getBoundingClientRect();
   return{center:Math.abs((t.left+t.right-s.left-s.right)/2),left:t.left-s.left,right:s.right-t.right,top:t.top-s.top,bottom:s.bottom-t.bottom};
  })};
 });
 expect(metrics.nodes.length).toBe(4);expect(metrics.nodes.every(Boolean)).toBe(true);
 for(const node of metrics.nodes){expect(node.center).toBeLessThanOrEqual(2);for(const edge of ['left','right','top','bottom'])expect(node[edge]).toBeGreaterThanOrEqual(-1);}
 expect(metrics.width).toBeLessThanOrEqual(metrics.naturalWidth+1);expect(metrics.height).toBeLessThanOrEqual(metrics.naturalHeight+1);
 expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth+1);expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight+2);
 const parent=await iframe.boundingBox();expect(parent.width).toBeLessThanOrEqual(metrics.naturalWidth+1);
 return{...metrics,parentWidth:parent.width};
}
