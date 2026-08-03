import { test as base, expect } from "@playwright/test";
import { createAppShellPage } from "../pages/app-shell.page";
import { createHomePage } from "../pages/home.page";

type PageObjects = {
  homePage: ReturnType<typeof createHomePage>;
  appShellPage: ReturnType<typeof createAppShellPage>;
};

export const test = base.extend<PageObjects>({
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
  appShellPage: async ({ page }, use) => {
    await use(createAppShellPage(page));
  },
});

export { expect };
