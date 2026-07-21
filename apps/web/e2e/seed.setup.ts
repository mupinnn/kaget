import { test as setup } from "@playwright/test";
import { SEED_PRIMARY_WALLET, SEED_SECONDARY_WALLET } from "./helpers/names";
import { createWalletsFormPage, createWalletsPage } from "./pages/wallets.page";

setup("seed baseline wallets", async ({ page }) => {
  const walletsPage = createWalletsPage(page);
  const walletsFormPage = createWalletsFormPage(page);

  await walletsPage.goto();
  await walletsPage.expectLoaded();

  if (!(await walletsPage.walletLink(SEED_PRIMARY_WALLET).isVisible())) {
    await walletsFormPage.gotoCreate();
    await walletsFormPage.fillCreateForm({
      name: SEED_PRIMARY_WALLET,
      type: "DIGITAL",
      initialBalance: "1000000",
    });
    await walletsFormPage.submit();
    await walletsPage.waitForPath("/wallets");
  }

  if (!(await walletsPage.walletLink(SEED_SECONDARY_WALLET).isVisible())) {
    await walletsFormPage.gotoCreate();
    await walletsFormPage.fillCreateForm({
      name: SEED_SECONDARY_WALLET,
      type: "CASH",
      initialBalance: "500000",
    });
    await walletsFormPage.submit();
    await walletsPage.waitForPath("/wallets");
  }
});
