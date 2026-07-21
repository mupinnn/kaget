import { api } from "@/libs/api.lib";
import { hydrateSettings } from "@/libs/session.lib";
import { unwrap } from "@/utils/api.util";
import type { CreateSettings, UpdateSettings } from "./settings.schemas";

export const getSettings = () => unwrap(api.api.settings.$get());

export const preloadSettings = () => hydrateSettings();

export async function createSettings(payload: CreateSettings) {
  const settings = await unwrap(api.api.settings.$post({ json: payload }));
  window.settings = settings;
  return settings;
}

export async function updateSettings(payload: UpdateSettings) {
  const settings = await unwrap(api.api.settings.$patch({ json: payload }));
  window.settings = settings;
  return settings;
}
