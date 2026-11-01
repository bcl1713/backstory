import workerSource from 'backstory:graphviz-worker';
import {parseDot} from './graphviz-model.js';
import {runBoundedWorker} from './bounded-worker.js';
import {installFrameProtocol} from './mermaid-frame-protocol.js';
import {graphvizSvg} from './graphviz-svg.js';
import {svgViewport} from './mermaid-svg.js';
installFrameProtocol(window,document.body.dataset.parentOrigin,async canonical=>{
  const output=await runBoundedWorker(workerSource,canonical);
  const svg=graphvizSvg(output,document),main=document.getElementById('diagram');
  main.replaceChildren(svg);document.body.style.margin='0';main.style.maxHeight='1200px';main.style.overflow='auto';
  return svgViewport(svg);
},{parse:parseDot});
