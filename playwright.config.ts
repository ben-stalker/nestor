import { defineConfig, devices } from '@playwright/test';

/**
 * Nestor E2E Playwright configuration.
 * Tests run against the server started with a test SQLite DB.
 */
export default defineConfig({
  testDir: 'e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Use fewer workers to avoid port conflicts */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }], ['github']],
  /* Shared settings for all the projects below. */
  use: {
    baseURL: 'http://localhost:3000',
    /* Collect trace on first retry */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Global setup to seed the test database */
  globalSetup: './e2e/global-setup.ts',

  /* Only Chromium for E2E */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the server before running tests.
   * In CI the server is started explicitly by the workflow (see e2e.yml)
   * so we just reuse the existing process.  Locally tsx is used for convenience. */
  webServer: {
    command: 'npx tsx server/src/index.ts',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI || !!process.env.NESTOR_E2E_SERVER_RUNNING,
    timeout: 60_000,
    env: {
      NESTOR_DB_PATH: '/tmp/e2e-test.db',
      NESTOR_PORT: '3000',
      NODE_ENV: 'test',
    },
  },
});
