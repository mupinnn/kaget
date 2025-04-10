import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
      await expect(page.locator('[data-testid=wallet-list] > a[href^="/wallets/"]')).toHaveCount(3);
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
          2
        );
      });
    });
  });

  await test.step("Records", async () => {
    await page.goto("/records");
    await page.waitForURL("/records");

    await test.step("Create an expense record", async () => {
      await page.getByRole("link", { name: "Record cashflow" }).click();
      await page.waitForURL("/records/create");

      await page.getByText("Choose a wallet").click();
      await page.getByRole("option", { name: "BNX" }).click();
      await expect(page.getByRole("combobox", { name: "Wallet" })).toHaveText(/BNX/);

      await page.getByText("Choose a record type").click();
      await page.getByRole("option", { name: "EXPENSE" }).click();
      await expect(page.getByRole("combobox", { name: "Type" })).toHaveText("EXPENSE");

      await page.getByLabel("Amount").fill("12500");
      await page.getByLabel("Note").fill("Buy chicken noodle soup");

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/records");

      await expect(page.getByText("Buy chicken noodle soup")).toBeVisible();
    });

    await test.step("Create an income record", async () => {
      await page.getByRole("link", { name: "New record" }).click();
      await page.waitForURL("/records/create");

      await page.getByText("Choose a wallet").click();
      await page.getByRole("option", { name: "BNX" }).click();
      await expect(page.getByRole("combobox", { name: "Wallet" })).toHaveText(/BNX/);

      await page.getByText("Choose a record type").click();
      await page.getByRole("option", { name: "INCOME" }).click();
      await expect(page.getByRole("combobox", { name: "Type" })).toHaveText("INCOME");

      await page.getByLabel("Amount").fill("12500");
      await page.getByLabel("Note").fill("Aunt May gives me");

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/records");

      await expect(page.getByText("Aunt May gives me")).toBeVisible();
    });

    await test.step("Delete a record", async () => {
      await page.getByText("Aunt May gives me").click();
      await page.waitForURL("/records/**");

      const deleteButton = page.getByRole("button", { name: "Delete" });
      await expect(deleteButton).toBeVisible();

      await deleteButton.click();
      await page.getByRole("button", { name: "Yes, delete" }).click();
      await page.waitForURL("/records");

      await expect(page.getByText("Aunt May gives me")).toBeHidden();
    });

    await test.step("Create an splitted expense record", async () => {
      await page.getByRole("link", { name: "New record" }).click();
      await page.waitForURL("/records/create");

      await page.getByText("Choose a wallet").click();
      await page.getByRole("option", { name: "BNX" }).click();
      await expect(page.getByRole("combobox", { name: "Wallet" })).toHaveText(/BNX/);

      await page.getByText("Choose a record type").click();
      await page.getByRole("option", { name: "EXPENSE" }).click();
      await expect(page.getByRole("combobox", { name: "Type" })).toHaveText(/EXPENSE/);

      await page.getByLabel("Note").fill("Groceries");

      for (let i = 0; i < 3; i++) {
        await page.getByRole("button", { name: "Split record" }).click();
        await page.locator(`input[name="items.${i}.amount"]`).fill("1000");
        await page.locator(`textarea[name="items.${i}.note"]`).fill(`Note for record ${i + 1}`);
      }

      expect(await page.locator(`p:near(:text("Total amount"))`).textContent()).toBe("$3,000.00");

      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/records");

      await expect(page.getByText("Groceries")).toBeVisible();
    });
  });

  await test.step("Budgets", async () => {
    await page.goto("/budgets");
    await page.waitForURL("/budgets");

    await test.step("Create budgets", async () => {
      await page.getByRole("link", { name: "Allocate money" }).click();
      await page.waitForURL("/budgets/create");

      await expect(page.getByRole("heading", { name: "Allocate your money" })).toBeVisible();

      for (let i = 0; i < 2; i++) {
        await page.getByTestId(`budgets.${i}.wallet-trigger`).click();
        await page.getByRole("option", { name: /BNX/ }).click();
        await expect(page.getByTestId(`budgets.${i}.wallet-trigger`)).toHaveText(/BNX/);

        await page.locator(`input[name="budgets.${i}.name"]`).fill(`Budget ${i + 1}`);
        await page.locator(`input[name="budgets.${i}.balance"]`).fill("4000");

        if (i < 1) await page.getByRole("button", { name: "Add allocation" }).click();
      }

      await page.getByRole("button", { name: "Summarize" }).click();
      await expect(page.getByRole("heading", { name: "Budget Allocation Summary" })).toBeVisible();

      await page.getByRole("button", { name: "Allocate!" }).click();
      await page.waitForURL("/budgets");
      await expect(page.locator('[data-testid=budget-list] > a[href^="/budgets/"]')).toHaveCount(2);
    });

    await test.step("Delete a budget", async () => {
      await page.getByText("Budget 2").click();
      await page.waitForURL("/budgets/**");

      await expect(page.getByRole("heading", { name: "Budget 2" })).toBeVisible();
      await expect(page.getByText("BUDGET - BNX")).toBeVisible();

      await page.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Yes, delete" }).click();
      await page.waitForURL("/budgets");

      await expect(page.getByText("Budget 2")).toBeHidden();
    });

    await test.step("Add balance to existing budget", async () => {
      await page.getByText("Budget 1").click();
      await page.waitForURL("/budgets/**");

      const addBalanceButton = page.getByRole("button", { name: "Add balance" });
      await expect(addBalanceButton).toBeVisible();

      await addBalanceButton.click();
      await expect(page.getByRole("heading", { name: "Add balance from BNX" })).toBeVisible();
      await page.getByLabel("Balance", { exact: true }).fill("2000");
      await page.locator("button[type=submit]").click();

      await expect(page.getByText("$6,000.00")).toBeVisible();
    });

    await test.step("Refund balance from existing budget", async () => {
      await page.getByRole("button", { name: "Refund" }).click();
      await expect(page.getByRole("heading", { name: "Refund to BNX" })).toBeVisible();

      await page.getByLabel("Balance", { exact: true }).fill("2000");
      await page.locator("button[type=submit]").click();

      await expect(page.getByText("$4,000.00")).toBeVisible();
    });

    await test.step("Use a budget", async () => {
      await page.getByRole("button", { name: "Use budget" }).click();
      await expect(page.getByRole("heading", { name: "Use budget" })).toBeVisible();

      await page.getByLabel("Amount").fill("2500");
      await page.getByLabel("Note").fill("Get some food");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText("Get some food")).toBeVisible();
      await expect(page.getByText("$1,500.00")).toBeVisible();
      await expect(page.getByRole("button", { name: "Delete" })).toBeHidden();
    });

    await test.step("Use a budget to its limit", async () => {
      await page.getByRole("button", { name: "Use budget" }).click();
      await page.getByLabel("Amount").fill("1500");
      await page.getByLabel("Note").fill("Party");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText("Party")).toBeVisible();
      await expect(page.getByText("$0.00")).toBeVisible();
      await expect(page.getByRole("button", { name: "Use budget" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Activate" })).toBeVisible();
    });
  });

  await test.step("Transfers", async () => {
    await page.goto("/transfers");
    await page.waitForURL("/transfers");
    await expect(page.getByRole("heading", { name: "Transfers" })).toBeVisible();

    await test.step("Transfer balance to between wallet", async () => {
      await page.getByRole("link", { name: "Transfer balance" }).click();
      await page.waitForURL("/transfers/create");

      await page.getByText("Choose a source wallet").click();
      await page.getByRole("option", { name: /BXI/ }).click();
      await expect(page.getByRole("combobox", { name: "Source wallet" })).toHaveText(/BXI/);

      await page.getByText("Choose a destination wallet").click();
      await page.getByRole("option", { name: /BNX/ }).click();
      await expect(page.getByRole("combobox", { name: "Destination wallet" })).toHaveText(/BNX/);

      await page.getByLabel("Amount").fill("50000");
      await page.getByLabel("Note").fill("Transfer to BNX");
      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForURL("/transfers");

      await expect(page.getByText("Transfer to BNX").first()).toBeVisible();
    });
  });

  await test.step("Settings", async () => {
    await page.goto("/settings");
    await page.waitForURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await test.step("Export and backup", async () => {
      await expect(page.getByRole("heading", { name: "Export data" })).toBeVisible();

      await page.getByRole("button", { name: "Export" }).click();

      const downloadLink = page.getByRole("link").filter({ hasText: /Click here to download/ });
      const downloadPromise = page.waitForEvent("download");

      await expect(downloadLink).toBeVisible();
      await downloadLink.click();

      const download = await downloadPromise;
      await download.saveAs((await download.path()) + download.suggestedFilename());
    });

    await test.step("Import and restore", async () => {
      const fileChooserPromise = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Select file" }).click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(
        path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "./test-data/kaget-export_2025-03-15T12_19_03.691Z.json"
        )
      );

      await page.getByRole("button", { name: "Import" }).click();

      await expect(page.getByRole("heading", { name: "Restore Backup" })).toBeVisible();
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByText("Successfully imported").first()).toBeVisible();

      await page.getByRole("link", { name: "Wallets" }).click();
      await expect(page.getByText("BXA")).toBeVisible();
      await expect(page.getByText("IDR 17,081,945.00")).toBeVisible();
      await expect(page.locator('[data-testid=wallet-list] > a[href^="/wallets/"]')).toHaveCount(1);
    });
  });
});
