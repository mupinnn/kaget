import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { debtLoan, record } from "../db/schema";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

describe("Debts & Loans API", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let otherAuthHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;
  let walletId: string;
  let lowBalanceWalletId: string;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const { auth, test } = await createTestAuth(testDatabase.db);

    const user = test.createUser({
      email: "debt-loans-test@example.com",
      name: "Debt Loans Test User",
    });
    await test.saveUser(user);
    authHeaders = await getTestAuthHeaders(test, user.id);

    const otherUser = test.createUser({
      email: "debt-loans-other@example.com",
      name: "Other User",
    });
    await test.saveUser(otherUser);
    otherAuthHeaders = await getTestAuthHeaders(test, otherUser.id);

    client = testClient(createTestApp(testDatabase.db, auth));

    const walletRes = await client.api.wallets.$post(
      {
        json: {
          name: "Main Wallet",
          type: "DIGITAL",
          initial_balance: 1000,
        },
      },
      { headers: authHeaders }
    );
    const { data: wallet } = await expectSuccess(walletRes, 201);
    walletId = wallet!.id;

    const lowWalletRes = await client.api.wallets.$post(
      {
        json: {
          name: "Low Balance Wallet",
          type: "CASH",
          initial_balance: 50,
        },
      },
      { headers: authHeaders }
    );
    const { data: lowWallet } = await expectSuccess(lowWalletRes, 201);
    lowBalanceWalletId = lowWallet!.id;
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  async function getWalletBalance(id: string) {
    const res = await client.api.wallets[":id"].$get({ param: { id } }, { headers: authHeaders });
    const { data } = await expectSuccess(res, 200);
    return Number.parseFloat(data!.balance);
  }

  describe("POST /debts-loans", () => {
    it("should create a debt and increase wallet balance", async () => {
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 100,
            other_party: "Sarah",
            occurred_at: "2026-02-01T00:00:00.000Z",
            note: "Rent help",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data).toMatchObject({
        type: "DEBT",
        otherParty: "Sarah",
        amount: "100.0000",
        sourceId: walletId,
        resolvedAt: null,
      });
      expect(data!.initialRecord?.recordType).toBe("DEBT");

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore + 100);
    });

    it("should create a loan and decrease wallet balance", async () => {
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: walletId,
            amount: 75,
            other_party: "Mike",
            occurred_at: "2026-02-02T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data).toMatchObject({
        type: "LOAN",
        otherParty: "Mike",
        amount: "75.0000",
      });
      expect(data!.initialRecord?.recordType).toBe("LOAN");

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore - 75);
    });

    it("should reject loan creation with insufficient balance", async () => {
      const res = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: lowBalanceWalletId,
            amount: 200,
            other_party: "Alex",
            occurred_at: "2026-02-03T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.DEBT_LOAN.INSUFFICIENT_BALANCE, 400);
    });

    it("should reject invalid input", async () => {
      const res = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: -10,
            other_party: "Sarah",
            occurred_at: "2026-02-01T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject unauthenticated requests", async () => {
      const res = await client.api["debts-loans"].$post({
        json: {
          type: "DEBT",
          wallet_id: walletId,
          amount: 10,
          other_party: "Sarah",
          occurred_at: "2026-02-01T00:00:00.000Z",
        },
      });

      await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
    });
  });

  describe("GET /debts-loans", () => {
    it("should list debt loans with filters and pagination", async () => {
      const res = await client.api["debts-loans"].$get(
        {
          query: {
            type: "DEBT",
            status: "PENDING",
            wallet_id: walletId,
            limit: "10",
            offset: "0",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data!.debt_loans.length).toBeGreaterThan(0);
      expect(data!.debt_loans.every(dl => dl.type === "DEBT")).toBe(true);
      expect(data!.debt_loans.every(dl => dl.resolvedAt === null)).toBe(true);
      expect(data!.pagination).toMatchObject({
        limit: 10,
        offset: 0,
        total: expect.any(Number),
      });
    });
  });

  describe("GET /debts-loans/:id", () => {
    it("should return debt loan detail with linked records and wallet", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 25,
            other_party: "Detail Test",
            occurred_at: "2026-02-04T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const res = await client.api["debts-loans"][":id"].$get(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data!.initialRecord).toBeDefined();
      expect(data!.wallet).toBeDefined();
      expect(data!.resolvedRecord).toBeNull();
    });

    it("should return 404 for another user's debt loan", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 15,
            other_party: "Private",
            occurred_at: "2026-02-05T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const res = await client.api["debts-loans"][":id"].$get(
        { param: { id: created!.id } },
        { headers: otherAuthHeaders }
      );

      await expectError(res, ERROR_CODES.DEBT_LOAN.NOT_FOUND, 404);
    });
  });

  describe("PATCH /debts-loans/:id", () => {
    it("should update note and other_party without changing balance", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 40,
            other_party: "Before",
            occurred_at: "2026-02-06T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"][":id"].$patch(
        {
          param: { id: created!.id },
          json: {
            note: "Updated note",
            other_party: "After",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data).toMatchObject({
        note: "Updated note",
        otherParty: "After",
        amount: "40.0000",
      });

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore);
    });

    it("should update debt amount and adjust wallet balance", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 100,
            other_party: "Amount Test",
            occurred_at: "2026-02-07T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"][":id"].$patch(
        {
          param: { id: created!.id },
          json: { amount: 150 },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data!.amount).toBe("150.0000");
      expect(data!.initialRecord?.amount).toBe("150.0000");

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore + 50);
    });

    it("should update loan amount with balance check", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: walletId,
            amount: 30,
            other_party: "Loan Update",
            occurred_at: "2026-02-08T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"][":id"].$patch(
        {
          param: { id: created!.id },
          json: { amount: 50 },
        },
        { headers: authHeaders }
      );

      await expectSuccess(res, 200);

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore - 20);
    });

    it("should reject loan amount increase with insufficient balance", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: lowBalanceWalletId,
            amount: 10,
            other_party: "Low Loan",
            occurred_at: "2026-02-09T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const res = await client.api["debts-loans"][":id"].$patch(
        {
          param: { id: created!.id },
          json: { amount: 500 },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.DEBT_LOAN.INSUFFICIENT_BALANCE, 400);
    });

    it("should reject update on resolved debt loan", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: walletId,
            amount: 20,
            other_party: "Resolved Edit",
            occurred_at: "2026-02-10T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      const res = await client.api["debts-loans"][":id"].$patch(
        {
          param: { id: created!.id },
          json: { note: "Too late" },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.DEBT_LOAN.ALREADY_RESOLVED, 400);
    });
  });

  describe("POST /debts-loans/:id/resolve", () => {
    it("should resolve a debt with repayment record", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 60,
            other_party: "Repay Test",
            occurred_at: "2026-02-11T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data!.resolvedAt).not.toBeNull();
      expect(data!.resolvedRecord?.recordType).toBe("DEBT_REPAYMENT");

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore - 60);
    });

    it("should reject debt resolve with insufficient balance", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: lowBalanceWalletId,
            amount: 100,
            other_party: "Cant Repay",
            occurred_at: "2026-02-12T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: lowBalanceWalletId,
            amount: 140,
            other_party: "Drain",
            occurred_at: "2026-02-12T01:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );

      const res = await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.DEBT_LOAN.INSUFFICIENT_BALANCE, 400);
    });

    it("should resolve a loan with collection record", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: walletId,
            amount: 35,
            other_party: "Collect Test",
            occurred_at: "2026-02-13T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data!.resolvedRecord?.recordType).toBe("LOAN_COLLECTION");

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore + 35);
    });

    it("should reject resolve when already resolved", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 10,
            other_party: "Double Resolve",
            occurred_at: "2026-02-14T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      const res = await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.DEBT_LOAN.ALREADY_RESOLVED, 400);
    });
  });

  describe("DELETE /debts-loans/:id", () => {
    it("should delete pending debt and reverse balance", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: walletId,
            amount: 45,
            other_party: "Delete Pending",
            occurred_at: "2026-02-15T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);
      const balanceBefore = await getWalletBalance(walletId);
      const initialRecordId = created!.initialRecordId;

      const res = await client.api["debts-loans"][":id"].$delete(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      await expectSuccess(res, 200);

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore - 45);

      const deletedRecord = await testDatabase.db.query.record.findFirst({
        where: eq(record.id, initialRecordId),
      });
      expect(deletedRecord).toBeUndefined();

      const deletedDebtLoan = await testDatabase.db.query.debtLoan.findFirst({
        where: eq(debtLoan.id, created!.id),
      });
      expect(deletedDebtLoan).toBeUndefined();
    });

    it("should delete resolved loan with zero net balance impact", async () => {
      const createRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "LOAN",
            wallet_id: walletId,
            amount: 55,
            other_party: "Delete Resolved",
            occurred_at: "2026-02-16T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      await client.api["debts-loans"][":id"].resolve.$post(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      const balanceBefore = await getWalletBalance(walletId);

      const res = await client.api["debts-loans"][":id"].$delete(
        { param: { id: created!.id } },
        { headers: authHeaders }
      );

      await expectSuccess(res, 200);

      const balanceAfter = await getWalletBalance(walletId);
      expect(balanceAfter).toBe(balanceBefore);
    });
  });

  describe("Wallet delete cascade", () => {
    it("should delete debt loans when wallet is deleted", async () => {
      const walletRes = await client.api.wallets.$post(
        {
          json: {
            name: "Cascade Wallet",
            type: "DIGITAL",
            initial_balance: 300,
          },
        },
        { headers: authHeaders }
      );
      const { data: cascadeWallet } = await expectSuccess(walletRes, 201);

      const debtRes = await client.api["debts-loans"].$post(
        {
          json: {
            type: "DEBT",
            wallet_id: cascadeWallet!.id,
            amount: 80,
            other_party: "Cascade",
            occurred_at: "2026-02-17T00:00:00.000Z",
          },
        },
        { headers: authHeaders }
      );
      const { data: debt } = await expectSuccess(debtRes, 201);

      const deleteRes = await client.api.wallets[":id"].$delete(
        { param: { id: cascadeWallet!.id } },
        { headers: authHeaders }
      );
      await expectSuccess(deleteRes, 200);

      const remaining = await testDatabase.db.query.debtLoan.findFirst({
        where: eq(debtLoan.id, debt!.id),
      });
      expect(remaining).toBeUndefined();
    });
  });
});
