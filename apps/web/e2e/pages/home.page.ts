import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage {
  readonly walletsSection = this.page.getByRole("heading", { name: "Wallets", exact: true });
  readonly budgetsSection = this.page.getByRole("heading", { name: "Budgets", exact: true });
  readonly recordsSection = this.page.getByRole("heading", { name: "Today's recap", exact: true });

  async goto() {
    await super.goto("/");
  }

  async expectLoaded() {
    await this.walletsSection.waitFor();
    await this.budgetsSection.waitFor();
  }
}

export function createHomePage(page: Page) {
  return new HomePage(page);
}
