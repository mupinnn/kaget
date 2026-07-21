import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class SignUpPage extends BasePage {
  readonly nameInput = this.page.getByLabel("Name");
  readonly emailInput = this.page.getByLabel("Email");
  readonly passwordInput = this.page.getByLabel("Password");
  readonly submitButton = this.page.getByRole("button", { name: "Sign up" });
  readonly title = this.page.getByText("Create your KaGet account", { exact: true });

  async goto() {
    await super.goto("/sign-up");
  }

  async signUp(name: string, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

export function createSignUpPage(page: Page) {
  return new SignUpPage(page);
}
