import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { fillCurrencyField, selectComboboxOption } from "./shared/form.helpers";

export class TransfersPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Transfers", exact: true });
  readonly createLink = this.page.getByRole("link", { name: "Transfer balance" });
  readonly emptyStateLink = this.page.getByRole("link", { name: "Transfer balance" });

  async goto() {
    await super.goto("/transfers");
  }

  async expectLoaded() {
    await this.heading.waitFor();
  }

  async openCreateForm() {
    await super.goto("/transfers/create");
  }

  async expectTransferNote(note: string) {
    await this.page.getByText(note).waitFor();
  }
}

export class TransfersFormPage extends BasePage {
  readonly saveButton = this.page.getByRole("button", { name: "Save" });
  readonly noteInput = this.page.getByLabel("Note");

  async gotoCreate() {
    await super.goto("/transfers/create");
  }

  async fillForm(options: {
    sourceWallet: string;
    destinationWallet: string;
    amount: string;
    note?: string;
    fee?: string;
  }) {
    await selectComboboxOption(this.page, "Source wallet", new RegExp(options.sourceWallet));
    await selectComboboxOption(
      this.page,
      "Destination wallet",
      new RegExp(options.destinationWallet)
    );
    await fillCurrencyField(this.page, "Amount", options.amount);
    if (options.fee) {
      await fillCurrencyField(this.page, "Fee", options.fee);
    }
    if (options.note) {
      await this.noteInput.fill(options.note);
    }
  }

  async submit() {
    await this.saveButton.click();
  }
}

export function createTransfersPage(page: Page) {
  return new TransfersPage(page);
}

export function createTransfersFormPage(page: Page) {
  return new TransfersFormPage(page);
}
