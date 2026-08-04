import { expect, test } from "../fixtures/test";
import { createSettingsPage } from "../pages/settings.page";

test.describe("Settings", () => {
  test("displays currency from local onboarding", async ({ page }) => {
    const settingsPage = createSettingsPage(page);

    await settingsPage.goto();
    await settingsPage.expectLoaded();
    await settingsPage.expectCurrency("IDR");

    await expect(
      page.getByText("Your currency preference is stored on this device.")
    ).toBeVisible();
  });

  test("shows Connect Google Drive chrome without requiring login", async ({ page }) => {
    const settingsPage = createSettingsPage(page);

    await settingsPage.goto();
    await settingsPage.expectLoaded();
    await settingsPage.expectDriveChromeSignedOut();

    await expect(page.getByRole("button", { name: "Sync now" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Disconnect" })).toHaveCount(0);
  });
});
