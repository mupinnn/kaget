import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

type SidebarRoute =
  | "Home"
  | "Wallets"
  | "Records"
  | "Budgets"
  | "Transfers"
  | "Debts & Loans"
  | "Settings";

export class AppShellPage extends BasePage {
  readonly brandLink = this.page.getByRole("link", { name: "KaGet" });
  readonly signOutButton = this.page.getByRole("button", { name: "Sign out" });

  sidebarLink(name: SidebarRoute) {
    return this.page.getByRole("link", { name, exact: true });
  }

  async navigateTo(name: SidebarRoute) {
    await this.sidebarLink(name).click();
  }

  async signOut() {
    await this.signOutButton.click();
    await this.waitForPath("/sign-in");
  }

  async expectSidebarVisible() {
    await this.sidebarLink("Home").waitFor();
    await this.sidebarLink("Wallets").waitFor();
  }
}

export function createAppShellPage(page: Page) {
  return new AppShellPage(page);
}
