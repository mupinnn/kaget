import { expect, test } from "../fixtures/test";
import { SEED_PRIMARY_WALLET, uniqueName } from "../helpers/names";
import {
  createRecordsDetailPage,
  createRecordsFormPage,
  createRecordsPage,
} from "../pages/records.page";

test.describe("Records", () => {
  test("creates an income record on a wallet", async ({ page }) => {
    const note = uniqueName("E2E Income");
    const recordsPage = createRecordsPage(page);
    const recordsFormPage = createRecordsFormPage(page);

    await recordsFormPage.gotoCreate();
    await recordsFormPage.fillForm({
      walletName: SEED_PRIMARY_WALLET,
      type: "INCOME",
      amount: "50000",
      note,
    });
    await recordsFormPage.submit();

    await recordsPage.waitForPath("/records");
    await expect(recordsPage.recordLink(note)).toBeVisible();
  });

  test("creates an expense record and deletes it from detail page", async ({ page }) => {
    const note = uniqueName("E2E Expense");
    const recordsPage = createRecordsPage(page);
    const recordsFormPage = createRecordsFormPage(page);
    const recordsDetailPage = createRecordsDetailPage(page);

    await recordsFormPage.gotoCreate();
    await recordsFormPage.fillForm({
      walletName: SEED_PRIMARY_WALLET,
      type: "EXPENSE",
      amount: "15000",
      note,
    });
    await recordsFormPage.submit();
    await recordsPage.openRecord(note);

    await recordsDetailPage.expectTitle(note);
    await recordsDetailPage.delete();

    await recordsPage.waitForPath("/records");
    await expect(recordsPage.recordLink(note)).not.toBeVisible();
  });
});
