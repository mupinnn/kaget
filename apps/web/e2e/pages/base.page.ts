import type { Page } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPath(path: string | RegExp) {
    await this.page.waitForURL(url => {
      const pathname = new URL(url).pathname;

      if (typeof path === "string") {
        return pathname === path || pathname === `${path}/`;
      }

      return path.test(pathname);
    });
  }
}
