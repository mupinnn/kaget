import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { createTestApp } from "./helpers/app";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

/** Legacy domain CRUD surfaces removed in #34 / ADR-007. */
const STRIPPED_DOMAIN_PATHS = [
  "/api/wallets",
  "/api/budgets",
  "/api/records",
  "/api/transfers",
  "/api/debts",
  "/api/loans",
  "/api/debt-loans",
  "/api/settings",
] as const;

const ALLOWED_PG_TABLES = new Set([
  "user",
  "session",
  "account",
  "verification",
  "drive_ledger_file",
]);

describe("Custodian boundary (strip domain)", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let app: ReturnType<typeof createTestApp>;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const testAuth = await createTestAuth(testDatabase.db);
    const user = testAuth.test.createUser({
      email: "strip-domain@example.com",
      name: "Strip Domain",
    });
    await testAuth.test.saveUser(user);
    authHeaders = await getTestAuthHeaders(testAuth.test, user.id);
    app = createTestApp(testDatabase.db, testAuth.auth);
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  it("does not mount legacy domain ledger CRUD routes", async () => {
    for (const path of STRIPPED_DOMAIN_PATHS) {
      const get = await app.request(path, { headers: authHeaders });
      expect(get.status, `GET ${path}`).toBe(404);

      const post = await app.request(path, { method: "POST", headers: authHeaders });
      expect(post.status, `POST ${path}`).toBe(404);
    }
  });

  it("keeps AppType RPC surface limited to me + drive ledger", () => {
    const client = testClient(app);
    expect(client.api.me).toBeDefined();
    expect(client.api.drive.ledger).toBeDefined();
    expect(client.api).not.toHaveProperty("wallets");
    expect(client.api).not.toHaveProperty("budgets");
    expect(client.api).not.toHaveProperty("records");
    expect(client.api).not.toHaveProperty("transfers");
  });

  it("Drizzle schema only includes auth + drive_ledger_file tables", () => {
    const tableNames = Object.values(schema)
      .filter(value => is(value, PgTable))
      .map(table => getTableName(table));

    expect(new Set(tableNames)).toEqual(ALLOWED_PG_TABLES);
    expect(tableNames).not.toContain("wallet");
    expect(tableNames).not.toContain("budget");
    expect(tableNames).not.toContain("record");
    expect(tableNames).not.toContain("transfer");
  });
});
