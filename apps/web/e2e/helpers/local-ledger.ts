import type { Page } from "@playwright/test";
import { createOnboardingPage } from "../pages/onboarding.page";
import { createWalletsFormPage, createWalletsPage } from "../pages/wallets.page";
import { SEED_PRIMARY_WALLET, SEED_SECONDARY_WALLET } from "./names";

export async function ensureOnboarded(page: Page, currencyCode = "IDR") {
  await page.goto("/");

  const onboardingTitle = page.getByTestId("onboarding-welcome-title");
  const homeNav = page.getByRole("link", { name: "Home", exact: true });

  // Root beforeLoad may redirect after the initial `/` response — wait for either outcome.
  await Promise.race([
    onboardingTitle.waitFor({ state: "visible" }),
    homeNav.waitFor({ state: "visible" }),
  ]);

  if (await onboardingTitle.isVisible()) {
    const onboarding = createOnboardingPage(page);
    await onboarding.completeOnboarding(currencyCode);
    await homeNav.waitFor({ state: "visible" });
  }
}

export async function ensureSeedWallets(page: Page) {
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
}

export async function prepareLocalLedger(page: Page, options: { seedWallets?: boolean } = {}) {
  await ensureOnboarded(page);
  if (options.seedWallets) {
    await ensureSeedWallets(page);
  }
}
