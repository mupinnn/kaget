import { test } from "../fixtures/test";
import { SEED_PRIMARY_WALLET, SEED_SECONDARY_WALLET, uniqueName } from "../helpers/names";
import { createTransfersFormPage, createTransfersPage } from "../pages/transfers.page";

test.describe("Transfers", () => {
  test("transfers balance between two wallets", async ({ page }) => {
    const note = uniqueName("E2E Transfer");
    const transfersPage = createTransfersPage(page);
    const transfersFormPage = createTransfersFormPage(page);

    await transfersPage.goto();
    await transfersPage.openCreateForm();
    await transfersFormPage.fillForm({
      sourceWallet: SEED_PRIMARY_WALLET,
      destinationWallet: SEED_SECONDARY_WALLET,
      amount: "75000",
      note,
    });
    await transfersFormPage.submit();

    await transfersPage.waitForPath("/transfers");
    await transfersPage.expectTransferNote(note);
  });

  test("creates a transfer with a fee", async ({ page }) => {
    const note = uniqueName("E2E Transfer Fee");
    const transfersPage = createTransfersPage(page);
    const transfersFormPage = createTransfersFormPage(page);

    await transfersPage.goto();
    await transfersFormPage.gotoCreate();
    await transfersFormPage.fillForm({
      sourceWallet: SEED_SECONDARY_WALLET,
      destinationWallet: SEED_PRIMARY_WALLET,
      amount: "10000",
      fee: "2500",
      note,
    });
    await transfersFormPage.submit();

    await transfersPage.waitForPath("/transfers");
    await transfersPage.expectTransferNote(note);
  });
});
