import { existsSync } from 'fs';

import { defineConfig, devices } from '@playwright/test';

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000/opspilot/';

function findChromium(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH)
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const candidate = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  if (existsSync(candidate)) return candidate;
  return undefined;
}

const executablePath = findChromium();

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
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath,
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
  ],
  webServer: {
    // e2e/server.mjs : serveur statique déterministe (équivalent GitHub
    // Pages : index de répertoire, cleanUrls, fallback SPA). `serve --single`
    // réécrivait /opspilot/admin/* vers l'index racine.
    command:
      'mkdir -p .playwright-site/opspilot && cp -R dist/. .playwright-site/ && cp -R dist/. .playwright-site/opspilot/ && node e2e/server.mjs .playwright-site 3000',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
