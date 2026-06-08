import { Hono } from "hono";
import type { Env } from "./config/env";
import type { Database } from "./db/client";
import type { Auth } from "./lib/auth";
import { onError } from "./lib/error";
import { createAuthMiddleware } from "./middleware/auth";
import { createCorsMiddleware } from "./middleware/cors";
import { createLoggerMiddleware } from "./middleware/logger";
import { createBudgetRoutes } from "./routes/budgets";
import { createMeRoutes } from "./routes/me";
import { createRecordRoutes } from "./routes/records";
import { createTransferRoutes } from "./routes/transfers";
import { createWalletRoutes } from "./routes/wallets";

export function createApp(env: Env, db: Database, auth: Auth) {
  return new Hono()
    .use("*", createCorsMiddleware(env))
    .use("/api/*", createLoggerMiddleware())
    .use("/api/*", createAuthMiddleware(auth))
    .on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw))
    .route("/api/me", createMeRoutes(auth))
    .route("/api/wallets", createWalletRoutes(db, auth))
    .route("/api/budgets", createBudgetRoutes(db, auth))
    .route("/api/records", createRecordRoutes(db, auth))
    .route("/api/transfers", createTransferRoutes(db, auth))
    .onError(onError);
}

export type AppType = ReturnType<typeof createApp>;
