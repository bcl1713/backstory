import { defineConfig } from '@playwright/test';
import { browserOrigin, runtime } from './tests/browser/support/server.js';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: process.env.BACKSTORY_BROWSER_RUNTIME ? `${runtime}/reports/browser-artifacts` : '/tmp/backstory-release-one/reports/browser-artifacts',
  reporter: 'list',
  // Tests mutate a shared wiki and restart this runner's server. Scale CI with
  // isolated shards; multiple workers against this server would race.
  workers: 1,
  timeout: 30000,
  use: { baseURL: browserOrigin, browserName: 'chromium', viewport: { width: 1180, height: 1000 }, hasTouch: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/browser/support/server.js', url: `${browserOrigin}/accounts/login/`, timeout: 60000, reuseExistingServer: false },
});
