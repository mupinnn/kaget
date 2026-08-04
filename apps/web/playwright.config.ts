import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const launchOptions = chromiumExecutable ? { executablePath: chromiumExecutable } : undefined;

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    launchOptions,
  },
  projects: [
    {
      name: "chromium-local",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch:
        /(navigation|auth|wallets|budgets|records|transfers|debts-loans|settings)\.spec\.ts/,
    },
    {
      name: "chromium-onboarding",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /onboarding\.spec\.ts/,
    },
  ],
  webServer: {
    command: "bun run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_API_URL: process.env.VITE_API_URL ?? "http://localhost:3000",
      VITE_APP_URL: process.env.VITE_APP_URL ?? baseURL,
    },
  },
});
