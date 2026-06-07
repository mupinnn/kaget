import { Hono } from "hono";
import type { Env } from "./config/env";
import type { Database } from "./db/client";
import type { Auth } from "./lib/auth";
import { onError } from "./lib/error";
import { createAuthMiddleware } from "./middleware/auth";
import { createCorsMiddleware } from "./middleware/cors";
import { createLoggerMiddleware } from "./middleware/logger";
import { createMeRoutes } from "./routes/me";
import { createWalletRoutes } from "./routes/wallets";

export function createApp(env: Env, db: Database, auth: Auth) {
  return new Hono()
    .use("*", createCorsMiddleware(env))
    .use("/api/*", createLoggerMiddleware())
    .use("/api/*", createAuthMiddleware(auth))
    .on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw))
    .route("/api/me", createMeRoutes(auth))
    .route("/api/wallets", createWalletRoutes(db, auth))
    .onError(onError);
}

export type AppType = ReturnType<typeof createApp>;
