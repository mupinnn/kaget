import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class SettingsPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Settings", exact: true });
  readonly currencyHeading = this.page.getByRole("heading", { name: "Currency", exact: true });

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
}

export function createSettingsPage(page: Page) {
  return new SettingsPage(page);
}
