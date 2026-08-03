import { db, LOCAL_SETTINGS_ID } from "@/libs/db.lib";
import { ConflictError, NotFoundError } from "@/utils/error.util";
import { setCachedCurrencyCode } from "./settings.cache";
import type { CreateSettings, Settings, UpdateSettings } from "./settings.schemas";

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get(LOCAL_SETTINGS_ID);
  if (!settings) {
    throw new NotFoundError("Settings not found");
  }
  setCachedCurrencyCode(settings.currencyCode);
  return settings;
}

export async function getSettingsOrNull(): Promise<Settings | null> {
  const settings = await db.settings.get(LOCAL_SETTINGS_ID);
  if (settings) {
    setCachedCurrencyCode(settings.currencyCode);
  }
  return settings ?? null;
}

export async function preloadSettings() {
  return getSettingsOrNull();
}

export async function createSettings(payload: CreateSettings): Promise<Settings> {
  const existing = await db.settings.get(LOCAL_SETTINGS_ID);
  if (existing) {
    throw new ConflictError("Settings already exist");
  }

  const now = new Date();
  const settings: Settings = {
    id: LOCAL_SETTINGS_ID,
    currencyCode: payload.currencyCode,
    createdAt: now,
    updatedAt: now,
  };

  await db.settings.add(settings);
  setCachedCurrencyCode(settings.currencyCode);
  return settings;
}

export async function updateSettings(payload: UpdateSettings): Promise<Settings> {
  const existing = await db.settings.get(LOCAL_SETTINGS_ID);
  if (!existing) {
    throw new NotFoundError("Settings not found");
  }

  const now = new Date();
  await db.settings.update(LOCAL_SETTINGS_ID, {
    currencyCode: payload.currencyCode,
    updatedAt: now,
  });

  return getSettings();
}
