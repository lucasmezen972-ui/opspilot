import { defineConfig, devices } from '@playwright/test';

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000/opspilot/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // serve.json : cleanUrls désactivé + réécriture SPA. `--single` réécrivait
    // aussi /opspilot/admin/* vers l'index racine (cleanUrls redirige
    // index.html → URL sans extension, puis la réécriture SPA s'applique) :
    // le back-office était inatteignable dans les E2E.
    command:
      'mkdir -p .playwright-site/opspilot && cp -R dist/. .playwright-site/ && cp -R dist/. .playwright-site/opspilot/ && printf \'{"cleanUrls": false, "rewrites": [{"source": "**", "destination": "/index.html"}]}\' > .playwright-site/serve.json && npx serve .playwright-site -l 3000',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
