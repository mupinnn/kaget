import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class SignInPage extends BasePage {
  readonly emailInput = this.page.getByLabel("Email");
  readonly passwordInput = this.page.getByLabel("Password");
  readonly submitButton = this.page.getByRole("button", { name: "Sign in" });
  readonly title = this.page.getByText("Sign in to KaGet", { exact: true });

  async goto() {
    await super.goto("/sign-in");
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

export function createSignInPage(page: Page) {
  return new SignInPage(page);
}
