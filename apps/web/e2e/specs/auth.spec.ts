import { expect, test } from "../fixtures/test";
import { createTestUser } from "../helpers/test-user";

test.describe("Auth", () => {
  test("signs up and redirects to onboarding", async ({ page, signUpPage, onboardingPage }) => {
    const user = createTestUser("auth-signup");

    await signUpPage.goto();
    await signUpPage.signUp(user.name, user.email, user.password);

    await expect(onboardingPage.welcomeTitle).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test("signs out and returns to sign-in", async ({
    page,
    signUpPage,
    onboardingPage,
    appShellPage,
    signInPage,
  }) => {
    const user = createTestUser("auth-signout");

    await signUpPage.goto();
    await signUpPage.signUp(user.name, user.email, user.password);
    await onboardingPage.welcomeTitle.waitFor();
    await onboardingPage.completeOnboarding("IDR");
    await appShellPage.expectSidebarVisible();

    await appShellPage.signOut();

    await expect(signInPage.title).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("signs in an existing user", async ({
    page,
    signUpPage,
    onboardingPage,
    appShellPage,
    signInPage,
    homePage,
  }) => {
    const user = createTestUser("auth-signin");

    await signUpPage.goto();
    await signUpPage.signUp(user.name, user.email, user.password);
    await onboardingPage.welcomeTitle.waitFor();
    await onboardingPage.completeOnboarding("IDR");
    await appShellPage.signOut();

    await signInPage.goto();
    await signInPage.signIn(user.email, user.password);

    await homePage.expectLoaded();
    await expect(page).toHaveURL(/\/$/);
  });
});
