import { expect, test } from "../fixtures/test";

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

  test("shows Continue with Google in the navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });
});
