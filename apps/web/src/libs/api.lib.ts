import type { AppType } from "@kaget/api";
import { hc } from "hono/client";

export const api = hc<AppType>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, credentials: "include" }),
});
