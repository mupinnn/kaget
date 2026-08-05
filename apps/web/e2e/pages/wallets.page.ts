import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { confirmDialog, fillCurrencyField, selectComboboxOption } from "./shared/form.helpers";

export class WalletsPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Wallets", exact: true });
  readonly walletList = this.page.getByTestId("wallet-list");
  readonly createWalletLink = this.page.getByRole("link", { name: "Create new wallet" });
  readonly emptyStateCreateLink = this.page.getByRole("link", { name: "Create a wallet" });

  async goto() {
    await super.goto("/wallets");
  }

  async expectLoaded() {
    await this.heading.waitFor();
    await this.walletList.waitFor();
  }

  async openCreateForm() {
    const createLink = this.createWalletLink.or(this.emptyStateCreateLink);
    await createLink.first().click();
  }

  walletLink(name: string) {
    return this.page.getByRole("link", { name: new RegExp(name) });
  }

  async openWallet(name: string) {
    await this.walletLink(name).click();
  }
}

export class WalletsFormPage extends BasePage {
  readonly nameInput = this.page.getByLabel("Name");
  readonly saveButton = this.page.getByRole("button", { name: "Save" });

  async gotoCreate() {
    await super.goto("/wallets/create");
  }

  async gotoEdit(walletId: string) {
    await super.goto(`/wallets/${walletId}/edit`);
  }

  async fillCreateForm(options: {
    name: string;
    type?: "CASH" | "DIGITAL";
    initialBalance?: string;
  }) {
    await this.nameInput.fill(options.name);
    await selectComboboxOption(this.page, "Type", options.type === "CASH" ? "Cash" : "Digital");
    if (options.initialBalance) {
      await fillCurrencyField(this.page, "Initial balance", options.initialBalance);
    }
  }

  async fillEditForm(name: string) {
    await this.nameInput.fill(name);
  }

  async submit() {
    await this.saveButton.click();
  }
}

export class WalletsDetailPage extends BasePage {
  readonly editLink = this.page.locator("main").getByRole("link", { name: "Edit", exact: true });
  readonly deleteButton = this.page
    .locator("main")
    .getByRole("button", { name: "Delete", exact: true });

  async expectTitle(name: string) {
    await this.page.getByRole("heading", { name, exact: true }).waitFor();
  }

  async clickEdit() {
    await this.editLink.click();
  }

  async delete() {
    await this.deleteButton.click();
    await confirmDialog(this.page, "Yes, delete");
  }

  async selectTab(tab: "Records" | "Transfers") {
    await this.page.getByRole("tab", { name: tab }).click();
  }
}

export function createWalletsPage(page: Page) {
  return new WalletsPage(page);
}

export function createWalletsFormPage(page: Page) {
  return new WalletsFormPage(page);
}

export function createWalletsDetailPage(page: Page) {
  return new WalletsDetailPage(page);
}
