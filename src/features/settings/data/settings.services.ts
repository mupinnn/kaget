import { successResponse } from "@/utils/service.util";
import { db } from "@/libs/db.lib";
import { type Settings, SettingsSchema } from "./settings.schemas";

export async function getSettings() {
  const storedSettings = await db.settings.limit(1).last();

  return successResponse({
    data: SettingsSchema.optional().parse(storedSettings),
    message: "Successfully retrieved settings",
  });
}

export async function createSettings(payload: Settings) {
  const data = SettingsSchema.parse(payload);
  const newSettings: Settings = {
    currency: data.currency,
  };

  await db.settings.add(newSettings);

  return successResponse({
    data: SettingsSchema.parse(newSettings),
    message: "Successfully save new settings",
  });
}
