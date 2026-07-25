import type { Page } from "@playwright/test";

export async function selectComboboxOption(page: Page, label: string, option: string | RegExp) {
  const field = page.locator('[data-slot="form-item"]').filter({
    has: page.getByText(label, { exact: true }),
  });
  await field.getByRole("combobox").click();
  await page.getByRole("option", { name: option }).click();
}

export async function fillCurrencyField(page: Page, label: string, value: string) {
  const field = page.locator('[data-slot="form-item"]').filter({
    has: page.getByText(label, { exact: true }),
  });
  await field.getByRole("textbox").fill(value);
}

export async function confirmDialog(page: Page, actionLabel: string) {
  const dialog = page.getByRole("alertdialog");
  await dialog.waitFor();
  await dialog.getByRole("button", { name: actionLabel }).click();
}
