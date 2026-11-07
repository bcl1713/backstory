import config from './playwright.config.js';
export default {...config,testMatch:['diagram-diagnostics.spec.js','renderer-browser.spec.js','diagram-preview.spec.js','diagram-clipping.spec.js','graph-navigation.spec.js','graph-controls.spec.js'],use:{...config.use,browserName:'firefox',hasTouch:false}};
