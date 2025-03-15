import { test, expect } from "@playwright/test";

test.use({
  locale: "en-US",
});

test.beforeAll("Setup", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2024-02-02T10:00:00"));
  await page.goto("/");
});

test("KaGet app should running just fine", async ({ page, baseURL }) => {
  await test.step("Onboarding", async () => {
    await test.step("Should land on onboarding page first", async () => {
      await expect(page).toHaveURL(/onboarding/);
    });

    await test.step("Has welcome title", async () => {
      await expect(
        page.getByRole("heading", { name: "Welcome to KaGet: Kawan Budget!" })
      ).toBeVisible();
    });

    await test.step("User can change their preferred currency", async () => {
      const selectCurrencyTrigger = page.getByTestId("onboarding-select-currency-trigger");

      await expect(selectCurrencyTrigger).toContainText("IDR");
      await selectCurrencyTrigger.click();

      await page.getByTestId("onboarding-currency-search-input").fill("USD");
      await page.getByTestId("onboarding-currency-item-USD").click();
      await expect(selectCurrencyTrigger).toContainText("USD");
    });

    await test.step("User can test and see formatted balance based on selected currency", async () => {
      await page.getByTestId("onboarding-sample-balance-input").fill("2500");
      await expect(page.getByTestId("onboarding-sample-balance-preview")).toHaveText("$2,500.00");
    });

    await test.step("User can see formatted date based on browser config", async () => {
      await expect(page.getByTestId("onboarding-sample-date-preview")).toContainText("AM");
      await expect(page.getByTestId("onboarding-sample-date-preview")).toContainText("10:00:00");
    });

    await test.step("User can save their settings and ready to use the app", async () => {
      await page.getByRole("button", { name: "Start budgeting!" }).click();
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "No wallet created" })).toBeVisible();
    });
  });

  test.fixme("Should be able to go to create wallet from dashboard", async () => {
    console.log(new Date().toLocaleDateString());
    expect(page.url()).toBe(baseURL);
    await expect(page.getByRole("link", { name: "Create a wallet" })).toBeVisible();
  });
});
