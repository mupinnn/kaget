import * as z from "zod";
import type { settings } from "../db/schema";

const FALLBACK_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "IDR",
  "INR",
  "KRW",
  "SGD",
  "AUD",
] as const;

export function getSupportedCurrencies(): readonly string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("currency");
  }
  return FALLBACK_CURRENCIES;
}

const supportedCurrencies = new Set(getSupportedCurrencies());

export const currencyCodeSchema = z
  .string()
  .length(3, "Currency code must be 3 characters")
  .transform(value => value.toUpperCase())
  .refine(value => supportedCurrencies.has(value), {
    message: "Invalid currency code",
  });

export const currencyCodeBodySchema = z.object({
  currencyCode: currencyCodeSchema,
});

export type SettingsRow = typeof settings.$inferSelect;

export type SettingsResponse = Pick<SettingsRow, "id" | "currencyCode" | "createdAt" | "updatedAt">;

export function toSettingsResponse(row: SettingsRow): SettingsResponse {
  const { id, currencyCode, createdAt, updatedAt } = row;
  return { id, currencyCode, createdAt, updatedAt };
}
