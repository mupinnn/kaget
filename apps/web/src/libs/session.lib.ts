import { getSettingsOrNull } from "@/features/settings/data/settings.services";
import { authClient } from "@/libs/auth.lib";

export async function getSession() {
  return authClient.getSession();
}

export async function hydrateSettings() {
  return getSettingsOrNull();
}

export function isAuthenticatedSession(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean(session.data?.session);
}
