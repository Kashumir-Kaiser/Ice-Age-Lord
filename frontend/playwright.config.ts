import { defineConfig, devices } from '@playwright/test';

const localChromiumPath = process.env.CHROMIUM_EXECUTABLE_PATH;
const productionPreview = process.env.PLAYWRIGHT_PREVIEW === '1';
const inMemoryPreview = process.env.PLAYWRIGHT_IN_MEMORY === '1';
const localBaseURL = productionPreview ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 20_000,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: localBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(localChromiumPath ? { launchOptions: {
      executablePath: localChromiumPath,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-crash-reporter', '--disable-breakpad', '--no-zygote', '--host-resolver-rules=MAP * ~NOTFOUND,EXCLUDE localhost,EXCLUDE 127.0.0.1'],
    } } : {}),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  ...(!inMemoryPreview ? { webServer: {
    command: productionPreview ? 'npm run preview -- --host 127.0.0.1 --port 4173' : 'npm run dev -- --host 127.0.0.1',
    url: localBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  } } : {}),
});
