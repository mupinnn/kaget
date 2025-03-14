import { test, expect } from "@playwright/test";

test.use({
  locale: "id-ID",
});

test.describe("Onboarding page flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("User should land on onboarding page first", async ({ page }) => {
    await expect(page).toHaveURL(/onboarding/);
  });

  test("Has welcome title", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Welcome to KaGet: Kawan Budget!" })
    ).toBeVisible();
  });

  test("User can change their preferred currency", async ({ page }) => {
    const selectCurrencyTrigger = page.getByTestId("onboarding-select-currency-trigger");

    await expect(selectCurrencyTrigger).toContainText("IDR");
    await selectCurrencyTrigger.click();

    await page.getByTestId("onboarding-currency-search-input").fill("USD");
    await page.getByTestId("onboarding-currency-item-USD").click();
    await expect(selectCurrencyTrigger).toContainText("USD");
  });

  test("User can test and see formatted balance based on selected currency", async ({ page }) => {
    await page.getByTestId("onboarding-sample-balance-input").fill("2500");
    await expect(page.getByTestId("onboarding-sample-balance-preview")).toHaveText("Rp 2.500,00");
  });

  test("User can see formatted date based on browser config", async ({ page }) => {
    await expect(page.getByTestId("onboarding-sample-date-preview")).toContainText("WIB");
    await expect(page.getByTestId("onboarding-sample-date-preview")).toContainText("pukul");
  });

  test("User can save their settings and ready to use the app", async ({ page }) => {
    await page.getByRole("button", { name: "Start budgeting!" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "No wallet created" })).toBeVisible();
  });
});
