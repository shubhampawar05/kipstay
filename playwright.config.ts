import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional when variables come from the environment.
}

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Uses the locally installed Google Chrome; set PW_CHANNEL="" to use Playwright's bundled Chromium.
    channel: process.env.PW_CHANNEL ?? "chrome",
    // The home page's first-visit fees notice is a modal; specs that cover it start from empty storage.
    storageState: { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: "kip:fees-notice-seen", value: "1" }] }] },
  },
  projects: [
    { name: "unit", testMatch: /unit\/.*\.spec\.ts/ },
    { name: "desktop", testMatch: /e2e\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", testMatch: /e2e\/mobile\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
  // Run against a production build: `npm run build` first. Reuses a server that's already running.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
