import { expect, test } from "../fixtures/test";

test.describe("Auth", () => {
  test("loads the app shell without signing in", async ({ page, appShellPage }) => {
    await page.goto("/");
    await appShellPage.expectSidebarVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("shows Continue with Google in Settings", async ({ page, appShellPage }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Google account" }).locator("..").getByRole("button", {
        name: "Continue with Google",
      })
    ).toBeVisible();
    await appShellPage.expectSidebarVisible();
  });

  test("shows Continue with Google in the navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });
});
