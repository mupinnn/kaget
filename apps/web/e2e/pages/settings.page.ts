import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class SettingsPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Settings", exact: true });
  readonly currencyHeading = this.page.getByRole("heading", { name: "Currency", exact: true });
  readonly driveHeading = this.page.getByRole("heading", { name: "Google Drive", exact: true });
  readonly connectDriveButton = this.page.getByRole("button", { name: "Connect Google Drive" });
  readonly driveSection = this.page.locator("#settings-google-drive");
  readonly exportHeading = this.page.getByRole("heading", { name: "Export data", exact: true });
  readonly exportSection = this.page.locator("#settings-export");

  async goto() {
    await super.goto("/settings");
  }

  async expectLoaded() {
    await this.heading.waitFor();
    await this.currencyHeading.waitFor();
  }

  async expectCurrency(code: string) {
    await this.page.getByText(code, { exact: true }).waitFor();
  }

  async expectDriveChromeSignedOut() {
    await this.driveHeading.waitFor();
    await this.connectDriveButton.waitFor();
    await this.page.getByText("Local use needs no login", { exact: false }).waitFor();
    await this.exportHeading.waitFor();
    await this.exportSection.waitFor();
  }
}

export function createSettingsPage(page: Page) {
  return new SettingsPage(page);
}
