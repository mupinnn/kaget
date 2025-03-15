import { test, expect } from "@playwright/test";

test.use({
  locale: "en-US",
});

test.beforeEach("Setup", async ({ page }) => {
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

  await test.step("Home", async () => {
    await test.step("Should have empty wallets, budgets, and today's recap widgets", async () => {
      await expect(page.getByRole("heading", { name: "No wallet created" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "No budget created" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "No records created" })).toBeVisible();
    });

    await test.step("Should have functioning sidebar", async () => {
      await expect(page.locator("[data-variant=sidebar][data-state=expanded]")).toBeVisible();

      await page.getByRole("button", { name: "Toggle sidebar" }).click();
      await expect(page.locator("[data-variant=sidebar][data-state=collapsed]")).toBeVisible();

      await page.getByRole("button", { name: "Toggle sidebar" }).click();
      await expect(page.locator("[data-variant=sidebar][data-state=expanded]")).toBeVisible();

      await test.step("Go to Wallets page", async () => {
        await page.getByRole("link", { name: "Wallets", exact: true }).click();
        await page.waitForURL("/wallets");
        await expect(page).toHaveURL("/wallets");
        await expect(page.getByRole("heading", { name: "Wallets", level: 1 })).toBeVisible();
      });

      await test.step("Go to Records page", async () => {
        await page.getByRole("link", { name: "Records", exact: true }).click();
        await page.waitForURL("/records");
        await expect(page).toHaveURL("/records");
        await expect(page.getByRole("heading", { name: "Records", level: 1 })).toBeVisible();
      });

      await test.step("Go to Budgets page", async () => {
        await page.getByRole("link", { name: "Budgets", exact: true }).click();
        await page.waitForURL("/budgets");
        await expect(page).toHaveURL("/budgets");
        await expect(page.getByRole("heading", { name: "Budgets", level: 1 })).toBeVisible();
      });

      await test.step("Go to Transfers page", async () => {
        await page.getByRole("link", { name: "Transfers", exact: true }).click();
        await page.waitForURL("/transfers");
        await expect(page).toHaveURL("/transfers");
        await expect(page.getByRole("heading", { name: "Transfers", level: 1 })).toBeVisible();
      });

      await test.step("Go to Settings page", async () => {
        await page.getByRole("link", { name: "Settings", exact: true }).click();
        await page.waitForURL("/settings");
        await expect(page).toHaveURL("/settings");
        await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
      });

      await test.step("Go to Home page", async () => {
        await page.getByRole("link", { name: "Home", exact: true }).click();
        await page.waitForURL("/");
        expect(page.url()).toBe(baseURL);
      });
    });
  });

  await test.step("Wallets", async () => {
    await test.step("Create a wallet", async () => {
      await page.getByRole("link", { name: "Create a wallet" }).click();
      await page.waitForURL("/wallets/create");
      await expect(page.getByRole("heading", { name: "Create wallet", level: 1 })).toBeVisible();

      await page.getByLabel("Name").fill("BXA");
      await page.getByLabel("Initial balance").fill("100000");
      await page.getByText("Choose a wallet type").click();
      await page.getByRole("option", { name: "DIGITAL" }).click();
      await expect(page.getByRole("combobox", { name: "Type" })).toHaveText("DIGITAL");

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/wallets");

      await page.getByRole("link", { name: "Create new wallet" }).click();
      await page.waitForURL("/wallets/create");
      await expect(page.getByRole("heading", { name: "Create wallet", level: 1 })).toBeVisible();

      await page.getByLabel("Name").fill("JAGX");
      await page.getByLabel("Initial balance").fill("50000");
      await page.getByText("Choose a wallet type").click();
      await page.getByRole("option", { name: "CASH" }).click();
      await expect(page.getByRole("combobox", { name: "Type" })).toHaveText("CASH");

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/wallets");

      await page.getByRole("link", { name: "Create new wallet" }).click();
      await page.waitForURL("/wallets/create");
      await expect(page.getByRole("heading", { name: "Create wallet", level: 1 })).toBeVisible();

      await page.getByLabel("Name").fill("BNX");
      await page.getByLabel("Initial balance").fill("25000");
      await page.getByText("Choose a wallet type").click();
      await page.getByRole("option", { name: "DIGITAL" }).click();
      await expect(page.getByRole("combobox", { name: "Type" })).toHaveText("DIGITAL");

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/wallets");

      await expect(page.getByRole("heading", { name: "No wallet created" })).toBeHidden();
      await expect(page.locator('[data-testid=wallet-list] > a[href^="/wallets/"]')).toHaveCount(2);
    });

    await test.step("Wallet detail", async () => {
      await page.getByText("BXA").click();
      await page.waitForURL("/wallets/**");

      await expect(page.getByRole("heading", { name: "BXA" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "No records created" })).toBeVisible();

      await page.getByRole("tab", { name: "Transfers" }).click();
      await expect(page.getByRole("heading", { name: "No transfer yet" })).toBeVisible();

      await test.step("Edit wallet name", async () => {
        await page.getByRole("link", { name: "Edit" }).click();
        await page.waitForURL("/wallets/**/edit");

        await expect(page.getByRole("heading", { name: "Update BXA wallet" })).toBeVisible();

        await page.getByLabel("Name").fill("BXI");
        await page.getByRole("button", { name: "Save" }).click();
        await page.waitForURL("/wallets/**");

        await expect(page.getByRole("heading", { name: "BXI" })).toBeVisible();
      });

      await test.step("Delete a wallet", async () => {
        await page.goto("/wallets");
        await page.waitForURL("/wallets");

        await page.getByText("JAGX").click();
        await page.waitForURL("/wallets/**");

        await page.getByRole("button", { name: "Delete" }).click();
        await page.getByRole("button", { name: "Yes, delete" }).click();
        await page.waitForURL("/wallets");

        await expect(page.getByText("JAGX")).toBeHidden();
        await expect(page.locator('[data-testid=wallet-list] > a[href^="/wallets/"]')).toHaveCount(
          1
        );
      });
    });
  });
});
