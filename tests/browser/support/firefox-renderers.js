import {readFileSync} from 'node:fs';

// Shared synthetic inputs for the mandatory patched-runtime matrix, ordinary
// renderer behavior tests and optional unpatched Firefox compatibility smoke.
export const firefoxRendererFixtures=JSON.parse(readFileSync(new URL('../../fixtures/firefox-renderers.json',import.meta.url)));

// Always resolve the currently active iframe. Parent messages can outlive a
// retired renderer (#90); neither message history nor frame URL identifies it.
export async function measureActiveRenderer(iframe){
 const frame=await(await iframe.elementHandle()).contentFrame();
 return frame.evaluate(()=>{
  const svg=document.querySelector('#diagram > svg'),box=svg.getBoundingClientRect();
  return{cssZoom:Number(getComputedStyle(document.documentElement).zoom),scale:devicePixelRatio,
   viewport:{width:innerWidth,height:innerHeight},svg:{right:box.right,bottom:box.bottom}};
 });
}

export const firefoxProfiles=[
 {name:'default',preferences:{},scale:1,widths:[390,1180,2000]},
 {name:'scale125',preferences:{'layout.css.devPixelsPerPx':'1.25'},scale:1.25,widths:[1180]},
 {name:'scale150',preferences:{'layout.css.devPixelsPerPx':'1.5'},scale:1.5,widths:[1180,2000]},
 {name:'scale200',preferences:{'layout.css.devPixelsPerPx':'2.0'},scale:2,widths:[1180]},
 {name:'document-fonts-off',preferences:{'browser.display.use_document_fonts':0},scale:1,widths:[1180]},
];
