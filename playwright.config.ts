import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
/** Point at an already running server (e.g. `next start -p 3002`) instead of starting `npm run dev`. */
const EXTERNAL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: EXTERNAL ?? `http://localhost:${PORT}`,
    locale: 'vi-VN',
    trace: 'retain-on-failure',
    // Tests mock /puzzles with page.route, which a service worker would bypass.
    // The offline test opts back in.
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: EXTERNAL
    ? undefined
    : {
        command: 'npm run dev',
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
