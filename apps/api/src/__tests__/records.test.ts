import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

describe("Records API", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;
  let walletId: string;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const { auth, test } = await createTestAuth(testDatabase.db);

    const user = test.createUser({
      email: "records-test@example.com",
      name: "Records Test User",
    });
    await test.saveUser(user);
    authHeaders = await getTestAuthHeaders(test, user.id);

    client = testClient(createTestApp(testDatabase.db, auth));

    const walletRes = await client.api.wallets.$post(
      {
        json: {
          name: "Records Wallet",
          type: "DIGITAL",
          initial_balance: 1000,
        },
      },
      { headers: authHeaders }
    );
    const { data: wallet } = await expectSuccess(walletRes, 201);
    walletId = wallet!.id;
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  describe("POST /records", () => {
    it("should create an income record with multiple items and update wallet balance", async () => {
      const res = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "INCOME",
            recorded_at: "2026-02-01T12:00:00.000Z",
            note: "Salary",
            items: [
              { note: "Base pay", amount: 300 },
              { note: "Bonus", amount: 200 },
            ],
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.amount).toBe("500.0000");
      expect(data.items).toHaveLength(2);
      expect(Number.parseFloat(data.wallet.balance)).toBe(1500);

      const walletRes = await client.api.wallets[":id"].$get(
        { param: { id: walletId } },
        { headers: authHeaders }
      );
      const { data: wallet } = await expectSuccess(walletRes, 200);
      expect(Number.parseFloat(wallet.balance)).toBe(1500);
    });

    it("should create an expense record and decrease wallet balance", async () => {
      const res = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-02T12:00:00.000Z",
            note: "Groceries",
            items: [{ amount: 150 }],
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.amount).toBe("150.0000");
      expect(Number.parseFloat(data.wallet.balance)).toBe(1350);
    });

    it("should reject record without items", async () => {
      const res = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-03T12:00:00.000Z",
            items: [],
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject zero item amount", async () => {
      const res = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-03T12:00:00.000Z",
            items: [{ amount: 0 }],
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject unknown wallet", async () => {
      const res = await client.api.records.$post(
        {
          json: {
            source_id: "unknown-wallet-id",
            source_type: "WALLET",
            record_type: "INCOME",
            recorded_at: "2026-02-03T12:00:00.000Z",
            items: [{ amount: 10 }],
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404);
    });
  });

  describe("GET /records", () => {
    it("should list records with pagination and filters", async () => {
      const res = await client.api.records.$get(
        {
          query: {
            source_id: walletId,
            record_type: "EXPENSE",
            limit: "10",
            offset: "0",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(Array.isArray(data.records)).toBe(true);
      expect(data.records.length).toBeGreaterThanOrEqual(1);
      expect(data.records[0].items.length).toBeGreaterThanOrEqual(1);
      expect(data.pagination).toMatchObject({
        limit: 10,
        offset: 0,
        total: expect.any(Number),
      });
    });
  });

  describe("GET /records/:id", () => {
    it("should get a single record with items and wallet", async () => {
      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "INCOME",
            recorded_at: "2026-02-04T12:00:00.000Z",
            items: [{ amount: 50 }],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const getRes = await client.api.records[":id"].$get(
        { param: { id: created.id } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(getRes, 200);
      expect(data.id).toBe(created.id);
      expect(data.wallet.id).toBe(walletId);
      expect(data.items).toHaveLength(1);
    });

    it("should return 404 for non-existent record", async () => {
      const res = await client.api.records[":id"].$get(
        { param: { id: "non-existent-id" } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.RECORD.NOT_FOUND, 404);
    });
  });

  describe("PATCH /records/:id", () => {
    it("should update note without changing balance", async () => {
      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-05T12:00:00.000Z",
            items: [{ amount: 25 }],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = created.wallet.balance;

      const updateRes = await client.api.records[":id"].$patch(
        {
          param: { id: created.id },
          json: { note: "Updated note" },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(updateRes, 200);
      expect(data.note).toBe("Updated note");
      expect(data.wallet.balance).toBe(balanceBefore);
    });

    it("should update amount via items and adjust balance", async () => {
      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-06T12:00:00.000Z",
            items: [{ amount: 40 }],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = Number.parseFloat(created.wallet.balance);

      const updateRes = await client.api.records[":id"].$patch(
        {
          param: { id: created.id },
          json: {
            items: [{ id: created.items[0].id, amount: 60 }],
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(updateRes, 200);
      expect(data.amount).toBe("60.0000");
      expect(Number.parseFloat(data.wallet.balance)).toBe(balanceBefore - 20);
    });

    it("should flip record type and adjust balance", async () => {
      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-07T12:00:00.000Z",
            items: [{ amount: 30 }],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = Number.parseFloat(created.wallet.balance);

      const updateRes = await client.api.records[":id"].$patch(
        {
          param: { id: created.id },
          json: { record_type: "INCOME" },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(updateRes, 200);
      expect(data.recordType).toBe("INCOME");
      expect(Number.parseFloat(data.wallet.balance)).toBe(balanceBefore + 60);
    });

    it("should move record to another wallet", async () => {
      const otherWalletRes = await client.api.wallets.$post(
        {
          json: {
            name: "Other Wallet",
            type: "CASH",
            initial_balance: 200,
          },
        },
        { headers: authHeaders }
      );
      const { data: otherWallet } = await expectSuccess(otherWalletRes, 201);

      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "INCOME",
            recorded_at: "2026-02-08T12:00:00.000Z",
            items: [{ amount: 75 }],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const sourceWalletBefore = Number.parseFloat(created.wallet.balance);
      const destWalletBefore = Number.parseFloat(otherWallet!.balance);

      const updateRes = await client.api.records[":id"].$patch(
        {
          param: { id: created.id },
          json: { source_id: otherWallet!.id },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(updateRes, 200);
      expect(data.sourceId).toBe(otherWallet!.id);
      expect(Number.parseFloat(data.wallet.balance)).toBe(destWalletBefore + 75);

      const sourceWalletRes = await client.api.wallets[":id"].$get(
        { param: { id: walletId } },
        { headers: authHeaders }
      );
      const { data: sourceWallet } = await expectSuccess(sourceWalletRes, 200);
      expect(Number.parseFloat(sourceWallet.balance)).toBe(sourceWalletBefore - 75);
    });

    it("should sync items on update", async () => {
      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-09T12:00:00.000Z",
            items: [
              { note: "Item A", amount: 10 },
              { note: "Item B", amount: 20 },
            ],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const keepItemId = created.items[0].id;

      const updateRes = await client.api.records[":id"].$patch(
        {
          param: { id: created.id },
          json: {
            items: [
              { id: keepItemId, note: "Item A updated", amount: 15 },
              { note: "Item C", amount: 5 },
            ],
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(updateRes, 200);
      expect(data.amount).toBe("20.0000");
      expect(data.items).toHaveLength(2);
      expect(data.items.find(item => item.id === keepItemId)?.note).toBe("Item A updated");
    });
  });

  describe("DELETE /records/:id", () => {
    it("should delete record and reverse wallet balance", async () => {
      const createRes = await client.api.records.$post(
        {
          json: {
            source_id: walletId,
            source_type: "WALLET",
            record_type: "EXPENSE",
            recorded_at: "2026-02-10T12:00:00.000Z",
            items: [{ amount: 45 }],
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = Number.parseFloat(created.wallet.balance);

      const deleteRes = await client.api.records[":id"].$delete(
        { param: { id: created.id } },
        { headers: authHeaders }
      );

      await expectSuccess(deleteRes, 200);

      const walletRes = await client.api.wallets[":id"].$get(
        { param: { id: walletId } },
        { headers: authHeaders }
      );
      const { data: wallet } = await expectSuccess(walletRes, 200);
      expect(Number.parseFloat(wallet.balance)).toBe(balanceBefore + 45);

      const items = await testDatabase.db.query.recordItem.findMany({
        where: item => eq(item.recordId, created.id),
      });
      expect(items).toHaveLength(0);
    });

    it("should return 404 for non-existent record", async () => {
      const res = await client.api.records[":id"].$delete(
        { param: { id: "non-existent-id" } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.RECORD.NOT_FOUND, 404);
    });
  });

  describe("Auth Protection", () => {
    it("should reject unauthorized requests", async () => {
      const res = await client.api.records.$get({ query: {} });

      await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
    });
  });
});
