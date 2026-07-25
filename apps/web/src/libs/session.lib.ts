import type { InferResponseType } from "hono/client";
import { api } from "@/libs/api.lib";
import { authClient } from "@/libs/auth.lib";
import { unwrap } from "@/utils/api.util";
import { NotFoundError } from "@/utils/error.util";

export type Settings = InferResponseType<typeof api.api.settings.$get, 200>["data"];

export async function getSession() {
  return authClient.getSession();
}

export async function fetchSettings(): Promise<Settings | null> {
  try {
    return await unwrap(api.api.settings.$get());
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
}

export async function hydrateSettings() {
  const settings = await fetchSettings();
  window.settings = settings ?? undefined;
  return settings;
}

export function isAuthenticatedSession(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean(session.data?.session);
}
