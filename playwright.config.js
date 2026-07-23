// Smoke tests drive the real game in the system Chrome (channel:'chrome') — no browser
// download, matching this repo's zero-heavy-tooling stance. Run: npm run smoke
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/smoke',
  timeout: 60_000,
  retries: 0,
  workers: 1,                       // one shared dev server, one world at a time
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'node server/server.js',
    port: 3000,
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
