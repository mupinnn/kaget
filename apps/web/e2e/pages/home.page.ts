import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage {
  readonly walletsSection = this.page.getByRole("heading", { name: "Wallets", exact: true });
  readonly budgetsSection = this.page.getByRole("heading", { name: "Budgets", exact: true });
  readonly recordsSection = this.page.getByRole("heading", { name: "Today's recap", exact: true });
  readonly driveConnectBanner = this.page.getByRole("alert").filter({
    hasText: "Optional Google Drive backup",
  });
  readonly driveConnectBannerSettingsLink = this.driveConnectBanner.getByRole("link", {
    name: "Open Settings",
  });
  readonly driveConnectBannerDismiss = this.driveConnectBanner.getByRole("button", {
    name: "Dismiss",
    exact: true,
  });

  async goto() {
    await super.goto("/");
  }

  async expectLoaded() {
    await this.walletsSection.waitFor();
    await this.budgetsSection.waitFor();
  }

  async expectDriveConnectBannerVisible() {
    await this.driveConnectBanner.waitFor();
  }

  async expectDriveConnectBannerHidden() {
    await this.driveConnectBanner.waitFor({ state: "hidden" });
  }

  async openDriveConnectBannerSettings() {
    await this.driveConnectBannerSettingsLink.click();
  }

  async dismissDriveConnectBanner() {
    await this.driveConnectBannerDismiss.click();
  }
}

export function createHomePage(page: Page) {
  return new HomePage(page);
}
