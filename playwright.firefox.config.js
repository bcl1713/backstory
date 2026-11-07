import config from './playwright.config.js';
import {firefoxProfiles} from './tests/browser/support/firefox-renderers.js';

// Use Playwright's supported patched Firefox; never replace executablePath with
// a stock binary. Preference changes need separate browser processes/projects.
export default {
 ...config,
 use:{...config.use,browserName:'firefox',hasTouch:false},
 projects:[
  {name:'firefox',testMatch:['diagram-diagnostics.spec.js','renderer-browser.spec.js','diagram-preview.spec.js','diagram-clipping.spec.js','graph-navigation.spec.js','graph-controls.spec.js','graph-query-recovery.spec.js','graph-mobile.spec.js']},
  ...firefoxProfiles.map(profile=>({
   name:profile.name,testMatch:'firefox-profiles.spec.js',metadata:{firefoxProfile:profile},
   use:{launchOptions:{firefoxUserPrefs:profile.preferences},deviceScaleFactor:profile.scale},
  })),
 ],
};
