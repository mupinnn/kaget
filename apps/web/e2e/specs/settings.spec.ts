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
});
