import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.E2E_PORT ?? 4173);
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${E2E_PORT}`;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list']],
    use: {
        baseURL: E2E_BASE_URL,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        video: 'retain-on-failure',
    },
    webServer: {
        command: process.env.CI ? 'pnpm -w e2e:serve:ci' : 'pnpm -w e2e:serve:dev',
        url: E2E_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});

