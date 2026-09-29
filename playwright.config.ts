import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /(mobile|visual)\.spec\.ts/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: /visual\.spec\.ts/ },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    port: PORT,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: { TMDB_FIXTURES: '1', NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});
