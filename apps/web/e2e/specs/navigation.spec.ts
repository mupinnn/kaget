import { expect, test } from "../fixtures/test";

const sidebarRoutes = [
  { name: "Home" as const, heading: "Wallets" },
  { name: "Wallets" as const, heading: "Wallets", testId: "wallet-list" },
  { name: "Records" as const, heading: "Records" },
  { name: "Budgets" as const, heading: "Budgets", testId: "budget-list" },
  { name: "Transfers" as const, heading: "Transfers" },
  { name: "Debts & Loans" as const, heading: "Debts & Loans" },
  { name: "Settings" as const, heading: "Settings" },
] as const;

test.describe("Navigation", () => {
  test.beforeEach(async ({ page, homePage }) => {
    await homePage.goto();
    await homePage.expectLoaded();
    await expect(page).toHaveURL(/\/$/);
  });

  for (const route of sidebarRoutes) {
    test(`navigates to ${route.name}`, async ({ page, appShellPage }) => {
      await appShellPage.navigateTo(route.name);

      await expect(page.getByRole("heading", { name: route.heading, exact: true })).toBeVisible();

      if ("testId" in route && route.testId) {
        await expect(page.getByTestId(route.testId)).toBeVisible();
      }
    });
  }
});
