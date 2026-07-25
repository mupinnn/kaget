import { expect, test } from "../fixtures/test";
import { createSettingsPage } from "../pages/settings.page";

test.describe("Settings", () => {
  test("displays synced currency from onboarding", async ({ page }) => {
    const settingsPage = createSettingsPage(page);

    await settingsPage.goto();
    await settingsPage.expectLoaded();
    await settingsPage.expectCurrency("IDR");

    await expect(page.getByText("Your account currency is synced from the server.")).toBeVisible();
  });
});
