import { expect, test } from "../fixtures/test";
import { uniqueName } from "../helpers/names";
import {
  createWalletsDetailPage,
  createWalletsFormPage,
  createWalletsPage,
} from "../pages/wallets.page";

test.describe("Wallets", () => {
  test("creates a wallet and shows it in the list", async ({ page }) => {
    const walletName = uniqueName("E2E Wallet");
    const walletsPage = createWalletsPage(page);
    const walletsFormPage = createWalletsFormPage(page);

    await walletsPage.goto();
    await walletsPage.openCreateForm();
    await walletsFormPage.fillCreateForm({
      name: walletName,
      type: "DIGITAL",
      initialBalance: "250000",
    });
    await walletsFormPage.submit();

    await walletsPage.waitForPath("/wallets");
    await expect(walletsPage.walletLink(walletName)).toBeVisible();
  });

  test("edits a wallet name from detail page", async ({ page }) => {
    const originalName = uniqueName("E2E Edit Wallet");
    const updatedName = uniqueName("E2E Updated Wallet");
    const walletsPage = createWalletsPage(page);
    const walletsFormPage = createWalletsFormPage(page);
    const walletsDetailPage = createWalletsDetailPage(page);

    await walletsPage.goto();
    await walletsPage.openCreateForm();
    await walletsFormPage.fillCreateForm({
      name: originalName,
      type: "CASH",
      initialBalance: "100000",
    });
    await walletsFormPage.submit();
    await walletsPage.openWallet(originalName);
    await walletsDetailPage.expectTitle(originalName);

    await walletsDetailPage.clickEdit();
    await walletsFormPage.fillEditForm(updatedName);
    await walletsFormPage.submit();

    await walletsDetailPage.expectTitle(updatedName);
    await expect(page).toHaveURL(/\/wallets\/[^/]+$/);
  });

  test("deletes a wallet from detail page", async ({ page }) => {
    const walletName = uniqueName("E2E Delete Wallet");
    const walletsPage = createWalletsPage(page);
    const walletsFormPage = createWalletsFormPage(page);
    const walletsDetailPage = createWalletsDetailPage(page);

    await walletsPage.goto();
    await walletsPage.openCreateForm();
    await walletsFormPage.fillCreateForm({
      name: walletName,
      type: "DIGITAL",
      initialBalance: "50000",
    });
    await walletsFormPage.submit();
    await walletsPage.openWallet(walletName);
    await walletsDetailPage.expectTitle(walletName);

    await walletsDetailPage.delete();

    await walletsPage.waitForPath("/wallets");
    await expect(walletsPage.walletLink(walletName)).not.toBeVisible();
  });

  test("shows wallet records and transfers tabs on detail page", async ({ page }) => {
    const walletName = uniqueName("E2E Tabs Wallet");
    const walletsPage = createWalletsPage(page);
    const walletsFormPage = createWalletsFormPage(page);
    const walletsDetailPage = createWalletsDetailPage(page);

    await walletsPage.goto();
    await walletsPage.openCreateForm();
    await walletsFormPage.fillCreateForm({
      name: walletName,
      type: "DIGITAL",
      initialBalance: "100000",
    });
    await walletsFormPage.submit();
    await walletsPage.openWallet(walletName);

    await walletsDetailPage.selectTab("Records");
    await expect(page.getByRole("tab", { name: "Records" })).toHaveAttribute(
      "data-state",
      "active"
    );

    await walletsDetailPage.selectTab("Transfers");
    await expect(page.getByRole("tab", { name: "Transfers" })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});
