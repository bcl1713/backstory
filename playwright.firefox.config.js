import config from './playwright.config.js';
export default {...config,testMatch:'renderer-browser.spec.js',use:{...config.use,browserName:'firefox',hasTouch:false}};
