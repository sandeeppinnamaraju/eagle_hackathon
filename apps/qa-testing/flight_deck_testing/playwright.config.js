const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  globalTeardown: './utils/globalTeardown.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'evidence/latest-playwright-report.json' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://willfully-grumble-likely.ngrok-free.dev',
    headless: true,
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'on',
    extraHTTPHeaders: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
