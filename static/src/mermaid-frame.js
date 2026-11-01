import mermaid from 'mermaid';
import { installFrameProtocol } from './mermaid-frame-protocol.js';
import { safeSvg } from './mermaid-svg.js';
import { DIAGRAM_LIMITS } from './mermaid-model.js';
const config={startOnLoad:false,securityLevel:'strict',htmlLabels:false,theme:'default',fontFamily:'Arial, sans-serif',fontSize:16,logLevel:'fatal',suppressErrorRendering:true,maxTextSize:DIAGRAM_LIMITS.source,maxEdges:DIAGRAM_LIMITS.edges,arrowMarkerAbsolute:false,layout:'dagre',flowchart:{htmlLabels:false,useMaxWidth:true,defaultRenderer:'dagre-wrapper',curve:'linear'}, deterministicIds:true, deterministicIDSeed:'bounded-flowchart'};
config.secure=Object.keys(config);
mermaid.initialize(config);
installFrameProtocol(window, document.body.dataset.parentOrigin, async canonical=>{
  const main=document.getElementById('diagram'), staging=document.createElement('div');
  staging.style.visibility='hidden';staging.style.position='absolute';staging.style.width='100%';
  main.append(staging);
  try {
    const result=await mermaid.render('diagram-svg',canonical,staging);
    // No bindFunctions, DOM import, or SVG transfer across the frame boundary.
    const svg=safeSvg(result.svg,document);
    main.replaceChildren(svg);
    document.body.style.margin='0';main.style.overflow='auto';main.style.maxHeight=`${DIAGRAM_LIMITS.height}px`;
    const box=svg.getBoundingClientRect();
    return{width:Math.max(1,Math.ceil(box.width)),height:Math.max(1,Math.ceil(box.height))};
  } finally { staging.remove(); }
});
