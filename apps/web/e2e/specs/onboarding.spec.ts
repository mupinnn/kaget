import { expect, test } from "../fixtures/test";
import { createTestUser } from "../helpers/test-user";

test.describe("Onboarding", () => {
  test("completes onboarding and lands on home", async ({
    page,
    signUpPage,
    onboardingPage,
    appShellPage,
    homePage,
  }) => {
    const user = createTestUser("onboarding");

    await signUpPage.goto();
    await signUpPage.signUp(user.name, user.email, user.password);
    await expect(onboardingPage.welcomeTitle).toBeVisible();

    await onboardingPage.completeOnboarding("IDR");

    await appShellPage.expectSidebarVisible();
    await homePage.expectLoaded();
    await expect(page).toHaveURL(/\/$/);
    await expect(onboardingPage.welcomeTitle).not.toBeVisible();
  });
});
