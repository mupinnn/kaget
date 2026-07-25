import { test as base } from "@playwright/test";
import { createAppShellPage } from "../pages/app-shell.page";
import { createHomePage } from "../pages/home.page";
import { createOnboardingPage } from "../pages/onboarding.page";
import { createSignInPage } from "../pages/sign-in.page";
import { createSignUpPage } from "../pages/sign-up.page";

type PageObjects = {
  signInPage: ReturnType<typeof createSignInPage>;
  signUpPage: ReturnType<typeof createSignUpPage>;
  onboardingPage: ReturnType<typeof createOnboardingPage>;
  homePage: ReturnType<typeof createHomePage>;
  appShellPage: ReturnType<typeof createAppShellPage>;
};

export const test = base.extend<PageObjects>({
  signInPage: async ({ page }, use) => {
    await use(createSignInPage(page));
  },
  signUpPage: async ({ page }, use) => {
    await use(createSignUpPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(createOnboardingPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },
  appShellPage: async ({ page }, use) => {
    await use(createAppShellPage(page));
  },
});

export { expect } from "@playwright/test";
