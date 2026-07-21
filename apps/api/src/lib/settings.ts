import type { settings } from "../db/schema";

export {
  currencyCodeBodySchema,
  currencyCodeSchema,
  getSupportedCurrencies,
} from "../routes/settings.schemas";

export type SettingsRow = typeof settings.$inferSelect;

export type SettingsResponse = Pick<SettingsRow, "id" | "currencyCode" | "createdAt" | "updatedAt">;

export function toSettingsResponse(row: SettingsRow): SettingsResponse {
  const { id, currencyCode, createdAt, updatedAt } = row;
  return { id, currencyCode, createdAt, updatedAt };
}
