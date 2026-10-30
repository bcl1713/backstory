import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testMatch: 'vim-escape-focus.spec.js',
  use: { ...base.use, browserName: 'firefox', hasTouch: false },
});
