import workerSource from 'backstory:vega-lite-worker';
import {parseVegaLite} from './vega-lite-model.js';
import {runBoundedWorker} from './bounded-worker.js';
import {installFrameProtocol} from './mermaid-frame-protocol.js';
import {vegaLiteSvg} from './vega-lite-svg.js';
import {svgViewport} from './mermaid-svg.js';
installFrameProtocol(window,document.body.dataset.parentOrigin,async canonical=>{
 const svg=vegaLiteSvg(await runBoundedWorker(workerSource,canonical),document),main=document.getElementById('diagram');
 main.replaceChildren(svg);document.body.style.margin='0';main.style.maxHeight='1200px';main.style.overflow='auto';return svgViewport(svg);
},{parse:parseVegaLite});
