import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { confirmDialog, fillCurrencyField, selectComboboxOption } from "./shared/form.helpers";

export class RecordsPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Records", exact: true });
  readonly newRecordLink = this.page.getByRole("link", { name: "New record" });
  readonly emptyStateCreateLink = this.page.getByRole("link", { name: "Record cashflow" });

  async goto() {
    await super.goto("/records");
  }

  async expectLoaded() {
    await this.heading.waitFor();
  }

  async openCreateForm() {
    const createLink = this.newRecordLink.or(this.emptyStateCreateLink);
    if (await createLink.first().isVisible()) {
      await createLink.first().click();
      return;
    }

    await this.gotoCreate();
  }

  recordLink(note: string) {
    return this.page.getByRole("link", { name: new RegExp(note) });
  }

  async openRecord(note: string) {
    await this.recordLink(note).click();
  }
}

export class RecordsFormPage extends BasePage {
  readonly saveButton = this.page.getByRole("button", { name: "Save" });
  readonly noteInput = this.page.getByLabel("Note");

  async gotoCreate() {
    await super.goto("/records/create");
  }

  async fillForm(options: {
    walletName: string;
    type: "INCOME" | "EXPENSE";
    amount: string;
    note: string;
  }) {
    await selectComboboxOption(this.page, "Wallet", new RegExp(options.walletName));
    await selectComboboxOption(this.page, "Type", options.type === "INCOME" ? "Income" : "Expense");
    await fillCurrencyField(this.page, "Amount", options.amount);
    await this.noteInput.fill(options.note);
  }

  async submit() {
    await this.saveButton.click();
  }
}

export class RecordsDetailPage extends BasePage {
  readonly deleteButton = this.page.getByRole("button", { name: "Delete" });

  async expectTitle(note: string) {
    await this.page.getByRole("heading", { name: note, exact: true }).waitFor();
  }

  async delete() {
    await this.deleteButton.click();
    await confirmDialog(this.page, "Yes, delete");
  }
}

export function createRecordsPage(page: Page) {
  return new RecordsPage(page);
}

export function createRecordsFormPage(page: Page) {
  return new RecordsFormPage(page);
}

export function createRecordsDetailPage(page: Page) {
  return new RecordsDetailPage(page);
}
