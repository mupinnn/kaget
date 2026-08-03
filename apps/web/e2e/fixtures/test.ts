import { test as base, expect } from "@playwright/test";
import { prepareLocalLedger } from "../helpers/local-ledger";
import { createAppShellPage } from "../pages/app-shell.page";
import { createHomePage } from "../pages/home.page";

type PageObjects = {
  homePage: ReturnType<typeof createHomePage>;
  appShellPage: ReturnType<typeof createAppShellPage>;
};

/**
 * Default fixture for signed-out local ledger flows.
 * Completes onboarding in this browser context (IndexedDB is not shared via storageState).
 */
export const test = base.extend<PageObjects>({
  page: async ({ page }, use) => {
    await prepareLocalLedger(page);
    await use(page);
  },
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
  appShellPage: async ({ page }, use) => {
    await use(createAppShellPage(page));
  },
});

/** Onboards + seeds baseline wallets (for records/budgets/transfers/debts specs). */
export const testWithSeed = base.extend<PageObjects>({
  page: async ({ page }, use) => {
    await prepareLocalLedger(page, { seedWallets: true });
    await use(page);
  },
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
  appShellPage: async ({ page }, use) => {
    await use(createAppShellPage(page));
  },
});

testWithSeed.setTimeout(90_000);

export { expect };
