import { cors } from "hono/cors";
import type { Env } from "../config/env";

export function createCorsMiddleware(env: Env) {
  return cors({
    origin: origin => {
      if (!origin) {
        return env.CORS_ORIGINS[0] ?? "";
      }
      return env.CORS_ORIGINS.includes(origin) ? origin : "";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });
}
