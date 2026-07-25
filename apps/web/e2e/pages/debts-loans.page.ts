import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { confirmDialog, fillCurrencyField, selectComboboxOption } from "./shared/form.helpers";

export class DebtLoansPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Debts & Loans", exact: true });
  readonly createLink = this.page.getByRole("link", { name: "New debt or loan" });

  async goto() {
    await super.goto("/debts-loans");
  }

  async expectLoaded() {
    await this.heading.waitFor();
  }

  async openCreateForm() {
    await this.createLink.click();
  }

  entryLink(party: string) {
    return this.page.getByRole("link", { name: new RegExp(party) });
  }

  async openEntry(party: string) {
    await this.entryLink(party).click();
  }
}

export class DebtLoansFormPage extends BasePage {
  readonly otherPartyInput = this.page.getByLabel("Other party");
  readonly saveButton = this.page.getByRole("button", { name: "Save" });
  readonly noteInput = this.page.getByLabel("Note");

  async gotoCreate() {
    await super.goto("/debts-loans/create");
  }

  async fillForm(options: {
    type?: "DEBT" | "LOAN";
    walletName: string;
    otherParty: string;
    amount: string;
    note?: string;
  }) {
    if (options.type === "LOAN") {
      await selectComboboxOption(this.page, "Type", /LOAN/);
    }
    await selectComboboxOption(this.page, "Wallet", new RegExp(options.walletName));
    await this.otherPartyInput.fill(options.otherParty);
    await fillCurrencyField(this.page, "Amount", options.amount);
    if (options.note) {
      await this.noteInput.fill(options.note);
    }
  }

  async submit() {
    await this.saveButton.click();
  }
}

export class DebtLoansDetailPage extends BasePage {
  readonly resolveButton = this.page.getByRole("button", { name: "Resolve" });
  readonly deleteButton = this.page.getByRole("button", { name: "Delete" });

  async expectTitle(party: string) {
    await this.page.getByRole("heading", { name: party, exact: true }).waitFor();
  }

  async expectPending() {
    await this.resolveButton.waitFor();
  }

  async expectResolved() {
    await this.resolveButton.waitFor({ state: "hidden" });
  }

  async resolve() {
    await this.resolveButton.click();
    await confirmDialog(this.page, "Resolve");
  }

  async delete() {
    await this.deleteButton.click();
    await confirmDialog(this.page, "Delete");
  }
}

export function createDebtLoansPage(page: Page) {
  return new DebtLoansPage(page);
}

export function createDebtLoansFormPage(page: Page) {
  return new DebtLoansFormPage(page);
}

export function createDebtLoansDetailPage(page: Page) {
  return new DebtLoansDetailPage(page);
}
