import { expect, test } from "../fixtures/test";
import { createHomePage } from "../pages/home.page";
import { createSettingsPage } from "../pages/settings.page";

test.describe("Auth", () => {
  test("loads the app shell without signing in", async ({ page, appShellPage }) => {
    await page.goto("/");
    await appShellPage.expectSidebarVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("shows Connect Google Drive in Settings without requiring login", async ({
    page,
    appShellPage,
  }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Google Drive", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Google Drive" })).toBeVisible();
    await appShellPage.expectSidebarVisible();
  });

  test("has no Google sign-in control in the navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  });

  test("home Drive banner deep-links to Settings Google Drive and can be dismissed", async ({
    page,
  }) => {
    const homePage = createHomePage(page);
    const settingsPage = createSettingsPage(page);

    await homePage.goto();
    await homePage.expectDriveConnectBannerVisible();

    await homePage.openDriveConnectBannerSettings();
    await expect(page).toHaveURL(/\/settings#settings-google-drive/);
    await settingsPage.expectDriveChromeSignedOut();
    await expect(settingsPage.driveSection).toBeInViewport();

    await homePage.goto();
    await homePage.expectDriveConnectBannerVisible();
    await homePage.dismissDriveConnectBanner();
    await homePage.expectDriveConnectBannerHidden();

    await page.reload();
    await homePage.expectLoaded();
    await homePage.expectDriveConnectBannerHidden();
  });
});
