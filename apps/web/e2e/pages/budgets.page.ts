import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { fillCurrencyField } from "./shared/form.helpers";

export class BudgetsPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: "Budgets", exact: true });
  readonly budgetList = this.page.getByTestId("budget-list");
  readonly createLink = this.page.getByRole("link", { name: "Create new allocation" });
  readonly emptyStateLink = this.page.getByRole("link", { name: "Allocate money" });

  async goto() {
    await super.goto("/budgets");
  }

  async expectLoaded() {
    await this.heading.waitFor();
    await this.budgetList.waitFor();
  }

  async openCreateForm() {
    const createLink = this.createLink.or(this.emptyStateLink);
    if (await createLink.first().isVisible()) {
      await createLink.first().click();
      return;
    }

    await this.gotoCreate();
  }

  async gotoCreate() {
    await super.goto("/budgets/create");
  }

  budgetLink(name: string) {
    return this.page.getByRole("link", { name: new RegExp(name) });
  }

  async openBudget(name: string) {
    await this.budgetLink(name).click();
  }
}

export class BudgetsFormPage extends BasePage {
  readonly summarizeButton = this.page.getByRole("button", { name: "Summarize" });
  readonly allocateButton = this.page.getByRole("button", { name: "Allocate!" });

  async gotoCreate() {
    await super.goto("/budgets/create");
  }

  async fillAllocation(
    index: number,
    options: { name: string; walletName: string; balance: string }
  ) {
    await this.page.getByLabel("Name").nth(index).fill(options.name);
    await this.page.getByTestId(`budgets.${index}.wallet-trigger`).click();
    await this.page
      .getByTestId(`budgets.${index}.wallet-item`)
      .filter({ hasText: options.walletName })
      .click();
    await fillCurrencyField(this.page, "Balance", options.balance);
  }

  async summarizeAndAllocate() {
    await this.summarizeButton.click();
    await this.page.getByText("Budget Allocation Summary").waitFor();
    await this.allocateButton.click();
  }
}

export class BudgetsDetailPage extends BasePage {
  readonly useBudgetButton = this.page.getByRole("button", { name: "Use budget" });

  async expectTitle(name: string) {
    await this.page.getByRole("heading", { name, exact: true }).waitFor();
  }

  async selectTab(tab: "Records" | "Transfers") {
    await this.page.getByRole("tab", { name: tab }).click();
  }

  async useBudget(options: { amount: string; note?: string }) {
    await this.useBudgetButton.click();
    const sheet = this.page.locator('[data-slot="sheet-content"]');
    await sheet.waitFor();
    await fillCurrencyField(this.page, "Amount", options.amount);
    if (options.note) {
      await sheet.getByLabel("Note").fill(options.note);
    }
    await sheet.getByRole("button", { name: "Save" }).click();
    await sheet.waitFor({ state: "hidden" });
  }
}

export function createBudgetsPage(page: Page) {
  return new BudgetsPage(page);
}

export function createBudgetsFormPage(page: Page) {
  return new BudgetsFormPage(page);
}

export function createBudgetsDetailPage(page: Page) {
  return new BudgetsDetailPage(page);
}
