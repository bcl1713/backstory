import base from './playwright.config.js';

// Focused cross-browser coverage without multiplying the full synthetic suite.
export default {
  ...base,
  testMatch: 'code-preview.spec.js',
  use: { ...base.use, browserName: 'firefox' },
};
