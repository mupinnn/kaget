import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { createDb } from "./db/client";
import { type Auth, createAuth } from "./lib/auth";
import { logger } from "./lib/logger";

const env = loadEnv();
const db = createDb(env.DATABASE_URL);
export const auth = createAuth(db, env);
const app = createApp(env, db, auth);

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
    wideEvent: Record<string, unknown>;
    user: Auth["$Infer"]["Session"]["user"] | null;
    session: Auth["$Infer"]["Session"]["session"] | null;
  }
}

const server = Bun.serve({
  port: env.API_PORT,
  fetch: app.fetch,
});

logger.info(`Server is running on http://${server.hostname}:${server.port}`);

export type { AppType } from "./app";
