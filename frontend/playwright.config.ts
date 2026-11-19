import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  use: { baseURL, ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
