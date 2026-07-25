import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class OnboardingPage extends BasePage {
  readonly welcomeTitle = this.page.getByTestId("onboarding-welcome-title");
  readonly currencyTrigger = this.page.getByTestId("onboarding-select-currency-trigger");
  readonly currencySearchInput = this.page.getByTestId("onboarding-currency-search-input");
  readonly sampleBalanceInput = this.page.getByTestId("onboarding-sample-balance-input");
  readonly submitButton = this.page.getByTestId("onboarding-createSettings-button");

  async goto() {
    await super.goto("/onboarding");
  }

  async selectCurrency(currencyCode: string) {
    await this.currencyTrigger.click();
    await this.currencySearchInput.fill(currencyCode);
    await this.page.getByTestId(`onboarding-currency-item-${currencyCode}`).click();
  }

  async completeOnboarding(currencyCode = "IDR") {
    await this.welcomeTitle.waitFor();
    await this.selectCurrency(currencyCode);
    await this.submitButton.click();
    await this.waitForPath("/");
  }
}

export function createOnboardingPage(page: Page) {
  return new OnboardingPage(page);
}
