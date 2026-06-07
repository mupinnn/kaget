import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { TestHelpers } from "better-auth/plugins";
import { testUtils } from "better-auth/plugins";
import type { Database } from "../../db/client";
import * as schema from "../../db/schema";
import { MOCK_ENV } from "./mock";

export async function createTestAuth(db: Database) {
  const auth = betterAuth({
    secret: MOCK_ENV.BETTER_AUTH_SECRET,
    baseURL: MOCK_ENV.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    trustedOrigins: MOCK_ENV.CORS_ORIGINS,
    plugins: [testUtils()],
    experimental: {
      joins: true,
    },
  });

  const ctx = await auth.$context;
  const test: TestHelpers = ctx.test;

  return { auth, test };
}

export type TestAuth = Awaited<ReturnType<typeof createTestAuth>>;

export async function getTestAuthHeaders(test: TestHelpers, userId: string) {
  const headers = await test.getAuthHeaders({ userId });
  return Object.fromEntries(headers.entries());
}
