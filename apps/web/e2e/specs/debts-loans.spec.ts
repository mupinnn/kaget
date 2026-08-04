import { expect, testWithSeed as test } from "../fixtures/test";
import { SEED_PRIMARY_WALLET, uniqueName } from "../helpers/names";
import {
  createDebtLoansDetailPage,
  createDebtLoansFormPage,
  createDebtLoansPage,
} from "../pages/debts-loans.page";

test.describe("Debts & Loans", () => {
  test("creates a debt and resolves it", async ({ page }) => {
    const party = uniqueName("E2E Creditor");
    const debtLoansPage = createDebtLoansPage(page);
    const debtLoansFormPage = createDebtLoansFormPage(page);
    const debtLoansDetailPage = createDebtLoansDetailPage(page);

    await debtLoansPage.goto();
    await debtLoansPage.openCreateForm();
    await debtLoansFormPage.fillForm({
      type: "DEBT",
      walletName: SEED_PRIMARY_WALLET,
      otherParty: party,
      amount: "30000",
      note: "E2E debt note",
    });
    await debtLoansFormPage.submit();

    await debtLoansDetailPage.expectTitle(party);
    await debtLoansDetailPage.expectPending();
    await debtLoansDetailPage.resolve();

    await debtLoansDetailPage.expectResolved();
    await expect(debtLoansDetailPage.resolveButton).not.toBeVisible();
  });

  test("creates a loan and deletes it while pending", async ({ page }) => {
    const party = uniqueName("E2E Borrower");
    const debtLoansPage = createDebtLoansPage(page);
    const debtLoansFormPage = createDebtLoansFormPage(page);
    const debtLoansDetailPage = createDebtLoansDetailPage(page);

    await debtLoansPage.goto();
    await debtLoansPage.openCreateForm();
    await debtLoansFormPage.fillForm({
      type: "LOAN",
      walletName: SEED_PRIMARY_WALLET,
      otherParty: party,
      amount: "20000",
    });
    await debtLoansFormPage.submit();

    await debtLoansDetailPage.expectTitle(party);
    await debtLoansDetailPage.delete();

    await debtLoansPage.waitForPath("/debts-loans");
    await expect(debtLoansPage.entryLink(party)).not.toBeVisible();
  });
});
