import { test as base, expect } from "@playwright/test";
import { createAppShellPage } from "../pages/app-shell.page";
import { createHomePage } from "../pages/home.page";
import { createOnboardingPage } from "../pages/onboarding.page";

type PageObjects = {
  homePage: ReturnType<typeof createHomePage>;
  appShellPage: ReturnType<typeof createAppShellPage>;
  onboardingPage: ReturnType<typeof createOnboardingPage>;
};

/** Fresh context — no onboarding / seed. Used for onboarding specs. */
export const test = base.extend<PageObjects>({
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
  appShellPage: async ({ page }, use) => {
    await use(createAppShellPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(createOnboardingPage(page));
  },
});

export { expect };
