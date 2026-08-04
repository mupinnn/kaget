import { expect, testWithSeed as test } from "../fixtures/test";
import { SEED_PRIMARY_WALLET, uniqueName } from "../helpers/names";
import {
  createBudgetsDetailPage,
  createBudgetsFormPage,
  createBudgetsPage,
} from "../pages/budgets.page";

test.describe("Budgets", () => {
  test("creates a budget allocation from a wallet", async ({ page }) => {
    const budgetName = uniqueName("E2E Budget");
    const budgetsPage = createBudgetsPage(page);
    const budgetsFormPage = createBudgetsFormPage(page);

    await budgetsFormPage.gotoCreate();
    await budgetsFormPage.fillAllocation(0, {
      name: budgetName,
      walletName: SEED_PRIMARY_WALLET,
      balance: "100000",
    });
    await budgetsFormPage.summarizeAndAllocate();

    await budgetsPage.waitForPath("/budgets");
    await expect(budgetsPage.budgetLink(budgetName)).toBeVisible();
  });

  test("opens budget detail and uses budget for an expense", async ({ page }) => {
    const budgetName = uniqueName("E2E Use Budget");
    const expenseNote = uniqueName("E2E Budget Expense");
    const budgetsPage = createBudgetsPage(page);
    const budgetsFormPage = createBudgetsFormPage(page);
    const budgetsDetailPage = createBudgetsDetailPage(page);

    await budgetsFormPage.gotoCreate();
    await budgetsFormPage.fillAllocation(0, {
      name: budgetName,
      walletName: SEED_PRIMARY_WALLET,
      balance: "200000",
    });
    await budgetsFormPage.summarizeAndAllocate();
    await budgetsPage.waitForPath("/budgets");
    await budgetsPage.openBudget(budgetName);

    await budgetsDetailPage.expectTitle(budgetName);
    await budgetsDetailPage.useBudget({ amount: "25000", note: expenseNote });

    await budgetsDetailPage.selectTab("Records");
    await expect(page.getByRole("link", { name: new RegExp(expenseNote) })).toBeVisible();
  });
});
