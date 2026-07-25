import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Context } from "hono";
import type { Env } from "../config/env";
import type { Database } from "../db/client";
import * as schema from "../db/schema/index";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: env.CORS_ORIGINS,
    experimental: {
      joins: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

export function getSafeSession(context: Context) {
  const session = context.get("session");
  const user = context.get("user");

  if (!session || !user) {
    context.set("user", null);
    context.set("session", null);
    throw new AppError(401, ERROR_CODES.AUTH.UNAUTHORIZED, "Unauthorized");
  }

  return {
    user,
    session,
  };
}
