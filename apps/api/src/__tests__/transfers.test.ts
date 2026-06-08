import { and, eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { record, transfer } from "../db/schema";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { seedBudget } from "./helpers/budgets";
import { setupTestDatabase } from "./helpers/db";

describe("Transfers API", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;
  let walletAId: string;
  let walletBId: string;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const { auth, test } = await createTestAuth(testDatabase.db);

    const user = test.createUser({
      email: "transfers-test@example.com",
      name: "Transfers Test User",
    });
    await test.saveUser(user);
    authHeaders = await getTestAuthHeaders(test, user.id);

    client = testClient(createTestApp(testDatabase.db, auth));

    const walletARes = await client.api.wallets.$post(
      {
        json: {
          name: "Wallet A",
          type: "DIGITAL",
          initial_balance: 1000,
        },
      },
      { headers: authHeaders }
    );
    const { data: walletA } = await expectSuccess(walletARes, 201);
    walletAId = walletA!.id;

    const walletBRes = await client.api.wallets.$post(
      {
        json: {
          name: "Wallet B",
          type: "CASH",
          initial_balance: 500,
        },
      },
      { headers: authHeaders }
    );
    const { data: walletB } = await expectSuccess(walletBRes, 201);
    walletBId = walletB!.id;
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  describe("POST /transfers", () => {
    it("should create a wallet-to-wallet transfer with double-entry records", async () => {
      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: walletBId,
            receiver_type: "WALLET",
            amount: 100,
            transferred_at: "2026-03-01T12:00:00.000Z",
            note: "Move funds",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.type).toBe("OUTGOING");
      expect(data.amount).toBe("100.0000");
      expect(data.fee).toBe("0.0000");
      expect(data.sourceId).toBe(walletAId);
      expect(data.destinationId).toBe(walletBId);

      const legs = await testDatabase.db.query.transfer.findMany({
        where: eq(transfer.refId, data.refId),
      });
      expect(legs).toHaveLength(2);

      const walletARes = await client.api.wallets[":id"].$get(
        { param: { id: walletAId } },
        { headers: authHeaders }
      );
      const { data: walletA } = await expectSuccess(walletARes, 200);
      expect(Number.parseFloat(walletA.balance)).toBe(900);

      const walletBRes = await client.api.wallets[":id"].$get(
        { param: { id: walletBId } },
        { headers: authHeaders }
      );
      const { data: walletB } = await expectSuccess(walletBRes, 200);
      expect(Number.parseFloat(walletB.balance)).toBe(600);
    });

    it("should create a transfer with fee and expense record without double-deducting", async () => {
      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: walletBId,
            receiver_type: "WALLET",
            amount: 50,
            fee: 5,
            transferred_at: "2026-03-02T12:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.fee).toBe("5.0000");

      const walletARes = await client.api.wallets[":id"].$get(
        { param: { id: walletAId } },
        { headers: authHeaders }
      );
      const { data: walletA } = await expectSuccess(walletARes, 200);
      expect(Number.parseFloat(walletA.balance)).toBe(845);

      const feeRecords = await testDatabase.db.query.record.findMany({
        where: and(eq(record.sourceId, walletAId), eq(record.recordType, "EXPENSE")),
        with: { items: true },
      });
      const feeRecord = feeRecords.find(r => r.note?.includes("Transfer fee"));
      expect(feeRecord).toBeDefined();
      expect(feeRecord!.amount).toBe("5.0000");
    });

    it("should reject insufficient sender balance", async () => {
      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: walletBId,
            receiver_type: "WALLET",
            amount: 10000,
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject transfer to same account", async () => {
      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: walletAId,
            receiver_type: "WALLET",
            amount: 10,
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should transfer from wallet to budget", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletAId,
        name: "Groceries",
        balance: 100,
        totalBalance: 500,
      });

      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: budgetData.id,
            receiver_type: "BUDGET",
            amount: 75,
            transferred_at: "2026-03-03T12:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      await expectSuccess(res, 201);

      const updatedBudget = await testDatabase.db.query.budget.findFirst({
        where: (b, { eq: eqFn }) => eqFn(b.id, budgetData.id),
      });
      expect(Number.parseFloat(updatedBudget!.balance)).toBe(175);
    });

    it("should transfer from budget to wallet", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletAId,
        name: "Refund Budget",
        balance: 200,
        totalBalance: 500,
      });

      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: budgetData.id,
            sender_type: "BUDGET",
            receiver_id: walletBId,
            receiver_type: "WALLET",
            amount: 80,
            transferred_at: "2026-03-04T12:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      await expectSuccess(res, 201);

      const updatedBudget = await testDatabase.db.query.budget.findFirst({
        where: (b, { eq: eqFn }) => eqFn(b.id, budgetData.id),
      });
      expect(Number.parseFloat(updatedBudget!.balance)).toBe(120);
    });

    it("should reject budget-to-budget transfer", async () => {
      const budget1 = await seedBudget(testDatabase.db, {
        walletId: walletAId,
        name: "Budget 1",
        balance: 100,
        totalBalance: 200,
      });
      const budget2 = await seedBudget(testDatabase.db, {
        walletId: walletAId,
        name: "Budget 2",
        balance: 50,
        totalBalance: 200,
      });

      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: budget1.id,
            sender_type: "BUDGET",
            receiver_id: budget2.id,
            receiver_type: "BUDGET",
            amount: 25,
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject transfer to archived budget", async () => {
      const archivedBudget = await seedBudget(testDatabase.db, {
        walletId: walletAId,
        name: "Archived",
        balance: 0,
        totalBalance: 100,
        archivedAt: new Date("2026-01-01T00:00:00.000Z"),
      });

      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: archivedBudget.id,
            receiver_type: "BUDGET",
            amount: 10,
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject transfer exceeding budget allocation", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletAId,
        name: "Tight Budget",
        balance: 450,
        totalBalance: 500,
      });

      const res = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: budgetData.id,
            receiver_type: "BUDGET",
            amount: 100,
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });

  describe("GET /transfers", () => {
    it("should list transfers with filters and pagination", async () => {
      const res = await client.api.transfers.$get(
        {
          query: {
            account_id: walletAId,
            account_type: "WALLET",
            type: "OUTGOING",
            limit: "10",
            offset: "0",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.transfers.length).toBeGreaterThan(0);
      expect(data.transfers.every(t => t.sourceId === walletAId && t.type === "OUTGOING")).toBe(
        true
      );
      expect(data.pagination.total).toBeGreaterThan(0);
    });
  });

  describe("GET /transfers/:id", () => {
    it("should return transfer with paired transfer", async () => {
      const createRes = await client.api.transfers.$post(
        {
          json: {
            sender_id: walletAId,
            sender_type: "WALLET",
            receiver_id: walletBId,
            receiver_type: "WALLET",
            amount: 10,
            transferred_at: "2026-03-10T12:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const res = await client.api.transfers[":id"].$get(
        { param: { id: created.id } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.pairedTransfer).toBeDefined();
      expect(data.pairedTransfer!.refId).toBe(data.refId);
      expect(data.pairedTransfer!.type).toBe("INCOMING");
    });

    it("should return 404 for non-owned transfer", async () => {
      const res = await client.api.transfers[":id"].$get(
        { param: { id: "non-existent-id" } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.TRANSFER.NOT_FOUND, 404);
    });
  });

  describe("Wallet delete cascade", () => {
    it("should delete owned outgoing transfer and preserve counterparty incoming", async () => {
      const cascadeWalletRes = await client.api.wallets.$post(
        {
          json: {
            name: "Cascade Source",
            type: "DIGITAL",
            initial_balance: 200,
          },
        },
        { headers: authHeaders }
      );
      const { data: cascadeWallet } = await expectSuccess(cascadeWalletRes, 201);

      const createRes = await client.api.transfers.$post(
        {
          json: {
            sender_id: cascadeWallet!.id,
            sender_type: "WALLET",
            receiver_id: walletBId,
            receiver_type: "WALLET",
            amount: 30,
            transferred_at: "2026-03-15T12:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: outgoing } = await expectSuccess(createRes, 201);

      const walletBBeforeRes = await client.api.wallets[":id"].$get(
        { param: { id: walletBId } },
        { headers: authHeaders }
      );
      const { data: walletBBefore } = await expectSuccess(walletBBeforeRes, 200);
      const balanceBeforeDelete = Number.parseFloat(walletBBefore.balance);

      await client.api.wallets[":id"].$delete(
        { param: { id: cascadeWallet!.id } },
        { headers: authHeaders }
      );

      const outgoingLeg = await testDatabase.db.query.transfer.findFirst({
        where: eq(transfer.id, outgoing.id),
      });
      expect(outgoingLeg).toBeUndefined();

      const incomingLeg = await testDatabase.db.query.transfer.findFirst({
        where: and(eq(transfer.refId, outgoing.refId), eq(transfer.type, "INCOMING")),
      });
      expect(incomingLeg).toBeDefined();
      expect(incomingLeg!.destinationName).toBe("Cascade Source");

      const walletBAfterRes = await client.api.wallets[":id"].$get(
        { param: { id: walletBId } },
        { headers: authHeaders }
      );
      const { data: walletBAfter } = await expectSuccess(walletBAfterRes, 200);
      expect(Number.parseFloat(walletBAfter.balance)).toBe(balanceBeforeDelete);
    });
  });

  describe("Auth Protection", () => {
    it("should reject unauthorized requests", async () => {
      const res = await client.api.transfers.$get({ query: {} });

      await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
    });
  });
});
