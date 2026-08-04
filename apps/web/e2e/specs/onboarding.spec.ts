import { expect, test } from "../fixtures/fresh";

test.describe("Onboarding", () => {
  test("redirects empty local settings to onboarding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("completes onboarding and lands on home", async ({ page, onboardingPage, appShellPage }) => {
    await page.goto("/onboarding");
    await onboardingPage.completeOnboarding("IDR");
    await expect(page).toHaveURL(/\/$/);
    await appShellPage.expectSidebarVisible();
  });
});
