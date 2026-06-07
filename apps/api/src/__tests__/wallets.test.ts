import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

describe("Wallets API", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const { auth, test } = await createTestAuth(testDatabase.db);

    const user = test.createUser({
      email: "test@example.com",
      name: "Test User",
    });
    await test.saveUser(user);
    authHeaders = await getTestAuthHeaders(test, user.id);

    client = testClient(createTestApp(testDatabase.db, auth));
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  describe("POST /wallets", () => {
    it("should create a wallet without initial balance", async () => {
      const res = await client.api.wallets.$post(
        {
          json: {
            name: "My Savings",
            type: "DIGITAL",
            initial_balance: 0,
          },
        },
        {
          headers: authHeaders,
        }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data).toMatchObject({
        name: "My Savings",
        type: "DIGITAL",
        balance: "0.0000",
      });
    });

    it("should create a wallet with initial balance as opening record", async () => {
      const res = await client.api.wallets.$post(
        {
          json: {
            name: "Cash Wallet",
            type: "CASH",
            initial_balance: 500,
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data).toMatchObject({
        name: "Cash Wallet",
        type: "CASH",
        balance: "500.0000",
      });

      const walletId = data?.id;
      const records = await testDatabase.db.query.record.findMany({
        where: rec => {
          return eq(rec.walletId, walletId!);
        },
      });
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe("INCOME");
      expect(records[0].category).toBe("Opening Balance");
      expect(records[0].amount).toBe("500.0000");
    });

    it("should reject invalid wallet name", async () => {
      const res = await client.api.wallets.$post(
        {
          json: {
            name: "",
            type: "DIGITAL",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject negative initial balance", async () => {
      const res = await client.api.wallets.$post(
        {
          json: {
            name: "Bad Wallet",
            type: "DIGITAL",
            initial_balance: -100,
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });

  describe("GET /wallets", () => {
    it("should list wallets for authenticated user", async () => {
      const res = await client.api.wallets.$get({}, { headers: authHeaders });

      const { data } = await expectSuccess(res, 200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /wallets/:id", () => {
    it("should get a single wallet", async () => {
      const createRes = await client.api.wallets.$post(
        {
          json: {
            name: "Detail Test",
            type: "DIGITAL",
          },
        },
        { headers: authHeaders }
      );

      const { data: createdWallet } = await expectSuccess(createRes, 201);
      const walletId = createdWallet?.id;

      const getRes = await client.api.wallets[":id"].$get(
        { param: { id: walletId! } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(getRes, 200);
      expect(data.id).toBe(walletId);
      expect(data.name).toBe("Detail Test");
    });

    it("should return 404 for non-existent wallet", async () => {
      const res = await client.api.wallets[":id"].$get(
        { param: { id: "non-existent-id" } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404);
    });
  });

  describe("PATCH /wallets/:id", () => {
    it("should update wallet name", async () => {
      const createRes = await client.api.wallets.$post(
        {
          json: {
            name: "Original Name",
            type: "CASH",
          },
        },
        { headers: authHeaders }
      );

      const { data: createdWallet } = await expectSuccess(createRes, 201);
      const walletId = createdWallet?.id;

      const updateRes = await client.api.wallets[":id"].$patch(
        {
          param: { id: walletId! },
          json: {
            name: "Updated Name",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(updateRes, 200);
      expect(data?.name).toBe("Updated Name");
    });

    it("should return 404 for non-existent wallet", async () => {
      const res = await client.api.wallets[":id"].$patch(
        {
          param: { id: "non-existent-id" },
          json: {
            name: "New Name",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404);
    });
  });

  describe("DELETE /wallets/:id", () => {
    it("should delete wallet and cascade delete records", async () => {
      const createRes = await client.api.wallets.$post(
        {
          json: {
            name: "To Delete",
            type: "DIGITAL",
            initial_balance: 100,
          },
        },
        { headers: authHeaders }
      );

      const { data: createdWallet } = await expectSuccess(createRes, 201);
      const walletId = createdWallet?.id;

      const deleteRes = await client.api.wallets[":id"].$delete(
        { param: { id: walletId! } },
        { headers: authHeaders }
      );

      const _deleteData = await expectSuccess(deleteRes, 200);

      const getRes = await client.api.wallets[":id"].$get(
        { param: { id: walletId! } },
        { headers: authHeaders }
      );

      await expectError(getRes, ERROR_CODES.WALLET.NOT_FOUND, 404);

      const records = await testDatabase.db.query.record.findMany({
        where: rec => {
          return eq(rec.walletId, walletId!);
        },
      });
      expect(records).toHaveLength(0);
    });

    it("should return 404 for non-existent wallet", async () => {
      const res = await client.api.wallets[":id"].$delete(
        { param: { id: "non-existent-id" } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404);
    });
  });

  describe("Auth Protection", () => {
    it("should reject unauthorized requests", async () => {
      const res = await client.api.wallets.$get();

      await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
    });
  });
});
