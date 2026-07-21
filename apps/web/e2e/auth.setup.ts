import { mkdir } from "node:fs/promises";
import { test as setup } from "@playwright/test";
import { createTestUser } from "./helpers/test-user";
import { createAppShellPage } from "./pages/app-shell.page";
import { createOnboardingPage } from "./pages/onboarding.page";
import { createSignUpPage } from "./pages/sign-up.page";

const authFile = "e2e/.auth/user.json";

setup("authenticate onboarding-complete user", async ({ page }) => {
  const user = createTestUser("setup");
  const signUpPage = createSignUpPage(page);
  const onboardingPage = createOnboardingPage(page);
  const appShellPage = createAppShellPage(page);

  await signUpPage.goto();
  await signUpPage.signUp(user.name, user.email, user.password);
  await onboardingPage.welcomeTitle.waitFor();
  await onboardingPage.completeOnboarding("IDR");
  await appShellPage.expectSidebarVisible();

  await mkdir("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: authFile });
});
