import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { transfer } from "../db/schema";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { seedBudget } from "./helpers/budgets";
import { setupTestDatabase } from "./helpers/db";

describe("Budgets API", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;
  let walletId: string;
  let walletBId: string;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const { auth, test } = await createTestAuth(testDatabase.db);

    const user = test.createUser({
      email: "budgets-test@example.com",
      name: "Budgets Test User",
    });
    await test.saveUser(user);
    authHeaders = await getTestAuthHeaders(test, user.id);

    client = testClient(createTestApp(testDatabase.db, auth));

    const walletRes = await client.api.wallets.$post(
      {
        json: {
          name: "Budget Wallet",
          type: "DIGITAL",
          initial_balance: 1000,
        },
      },
      { headers: authHeaders }
    );
    const { data: wallet } = await expectSuccess(walletRes, 201);
    walletId = wallet!.id;

    const walletBRes = await client.api.wallets.$post(
      {
        json: {
          name: "Budget Wallet B",
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

  describe("POST /budgets", () => {
    it("should create a BUDGET with wallet deduction and transfer legs", async () => {
      const res = await client.api.budgets.$post(
        {
          json: {
            name: "Groceries",
            wallet_id: walletId,
            amount: 200,
            budget_type: "BUDGET",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.name).toBe("Groceries");
      expect(data.budgetType).toBe("BUDGET");
      expect(data.balance).toBe("200.0000");
      expect(data.totalBalance).toBe("200.0000");
      expect(data.usedAmount).toBe(0);
      expect(data.archivedAt).toBeNull();

      const walletRes = await client.api.wallets[":id"].$get(
        { param: { id: walletId } },
        { headers: authHeaders }
      );
      const { data: wallet } = await expectSuccess(walletRes, 200);
      expect(Number.parseFloat(wallet.balance)).toBe(800);

      const outgoing = await testDatabase.db.query.transfer.findFirst({
        where: (t, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(t.sourceId, walletId), eqFn(t.sourceType, "WALLET"), eqFn(t.type, "OUTGOING")),
      });
      expect(outgoing).toBeDefined();
      expect(outgoing!.amount).toBe("200.0000");

      const legs = await testDatabase.db.query.transfer.findMany({
        where: eq(transfer.refId, outgoing!.refId),
      });
      expect(legs).toHaveLength(2);
    });

    it("should create a GOAL with optional initial contribution", async () => {
      const res = await client.api.budgets.$post(
        {
          json: {
            name: "Vacation Goal",
            wallet_id: walletId,
            amount: 500,
            budget_type: "GOAL",
            initial_contribution: 100,
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.budgetType).toBe("GOAL");
      expect(data.balance).toBe("100.0000");
      expect(data.totalBalance).toBe("500.0000");
      expect(data.isReached).toBe(false);
    });

    it("should create a GOAL with zero initial contribution", async () => {
      const res = await client.api.budgets.$post(
        {
          json: {
            name: "New Goal",
            wallet_id: walletId,
            amount: 300,
            budget_type: "GOAL",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data.balance).toBe("0.0000");
      expect(data.totalBalance).toBe("300.0000");
    });

    it("should reject insufficient wallet balance", async () => {
      const res = await client.api.budgets.$post(
        {
          json: {
            name: "Too Big",
            wallet_id: walletId,
            amount: 10000,
            budget_type: "BUDGET",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject non-positive amount", async () => {
      const res = await client.api.budgets.$post(
        {
          json: {
            name: "Invalid",
            wallet_id: walletId,
            amount: 0,
            budget_type: "BUDGET",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject unknown wallet", async () => {
      const res = await client.api.budgets.$post(
        {
          json: {
            name: "Orphan",
            wallet_id: "unknown-wallet",
            amount: 50,
            budget_type: "BUDGET",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.WALLET.NOT_FOUND, 404);
    });
  });

  describe("POST /budgets/bulk", () => {
    it("should create multiple budgets across wallets", async () => {
      const res = await client.api.budgets.bulk.$post(
        {
          json: {
            budgets: [
              {
                name: "Bulk A",
                wallet_id: walletId,
                amount: 50,
                budget_type: "BUDGET",
              },
              {
                name: "Bulk B",
                wallet_id: walletBId,
                amount: 75,
                budget_type: "BUDGET",
              },
            ],
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("Bulk A");
      expect(data[1].name).toBe("Bulk B");
    });

    it("should reject when per-wallet sum exceeds balance", async () => {
      const res = await client.api.budgets.bulk.$post(
        {
          json: {
            budgets: [
              {
                name: "Bulk 1",
                wallet_id: walletId,
                amount: 500,
                budget_type: "BUDGET",
              },
              {
                name: "Bulk 2",
                wallet_id: walletId,
                amount: 500,
                budget_type: "BUDGET",
              },
            ],
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });

  describe("GET /budgets", () => {
    it("should list budgets with computed fields and filters", async () => {
      const listRes = await client.api.budgets.$get(
        { query: { budget_type: "BUDGET", archived: "false" } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(listRes, 200);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("usedAmount");
      expect(data[0]).toHaveProperty("usedPercentage");
      expect(data[0]).toHaveProperty("isReached");
    });

    it("should filter by wallet_id", async () => {
      const listRes = await client.api.budgets.$get(
        { query: { wallet_id: walletBId } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(listRes, 200);
      expect(data.every(b => b.walletId === walletBId)).toBe(true);
    });
  });

  describe("GET /budgets/:id", () => {
    it("should return budget detail with isReached for GOAL", async () => {
      const createRes = await client.api.budgets.$post(
        {
          json: {
            name: "Reached Goal",
            wallet_id: walletBId,
            amount: 100,
            budget_type: "GOAL",
            initial_contribution: 100,
          },
        },
        { headers: authHeaders }
      );
      const { data: created } = await expectSuccess(createRes, 201);

      const detailRes = await client.api.budgets[":id"].$get(
        { param: { id: created.id } },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(detailRes, 200);
      expect(data.isReached).toBe(true);
      expect(data.usedAmount).toBe(0);
    });

    it("should return 404 for unknown budget", async () => {
      const res = await client.api.budgets[":id"].$get(
        { param: { id: "unknown-budget" } },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.BUDGET.NOT_FOUND, 404);
    });
  });

  describe("POST /budgets/:id/add-funds", () => {
    it("should add funds to a BUDGET up to total allocation", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Add Funds Budget",
        balance: 50,
        totalBalance: 200,
      });

      const res = await client.api.budgets[":id"]["add-funds"].$post(
        {
          param: { id: budgetData.id },
          json: { amount: 30 },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.balance).toBe("80.0000");
    });

    it("should reject exceeding original allocation for BUDGET", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Capped Budget",
        balance: 180,
        totalBalance: 200,
      });

      const res = await client.api.budgets[":id"]["add-funds"].$post(
        {
          param: { id: budgetData.id },
          json: { amount: 50 },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject contribution exceeding remaining target for GOAL", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Goal Add",
        balance: 80,
        totalBalance: 100,
        budgetType: "GOAL",
      });

      const res = await client.api.budgets[":id"]["add-funds"].$post(
        {
          param: { id: budgetData.id },
          json: { amount: 30 },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject add to archived budget", async () => {
      const archived = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Archived Add",
        balance: 0,
        totalBalance: 100,
        archivedAt: new Date(),
      });

      const res = await client.api.budgets[":id"]["add-funds"].$post(
        {
          param: { id: archived.id },
          json: { amount: 10 },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });

  describe("POST /budgets/:id/refund", () => {
    it("should refund partial amount from budget to wallet", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Refund Budget",
        balance: 150,
        totalBalance: 200,
      });

      const res = await client.api.budgets[":id"].refund.$post(
        {
          param: { id: budgetData.id },
          json: { amount: 50 },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.balance).toBe("100.0000");
      expect(data.archivedAt).toBeNull();
    });

    it("should auto-archive when refund depletes balance to zero", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Full Refund",
        balance: 40,
        totalBalance: 200,
      });

      const res = await client.api.budgets[":id"].refund.$post(
        {
          param: { id: budgetData.id },
          json: { amount: 40 },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.balance).toBe("0.0000");
      expect(data.archivedAt).not.toBeNull();
    });

    it("should reject refund exceeding balance", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Over Refund",
        balance: 30,
        totalBalance: 100,
      });

      const res = await client.api.budgets[":id"].refund.$post(
        {
          param: { id: budgetData.id },
          json: { amount: 50 },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });

  describe("POST /budgets/:id/reactivate", () => {
    it("should reactivate with same amount", async () => {
      const archived = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Reactivate Same",
        balance: 0,
        totalBalance: 120,
        archivedAt: new Date(),
      });

      const res = await client.api.budgets[":id"].reactivate.$post(
        {
          param: { id: archived.id },
          json: { use_same_amount: true },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.archivedAt).toBeNull();
      expect(data.balance).toBe("120.0000");
      expect(data.totalBalance).toBe("120.0000");
    });

    it("should reactivate with new amount", async () => {
      const archived = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Reactivate New",
        balance: 0,
        totalBalance: 80,
        archivedAt: new Date(),
      });

      const res = await client.api.budgets[":id"].reactivate.$post(
        {
          param: { id: archived.id },
          json: { use_same_amount: false, amount: 150 },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.balance).toBe("150.0000");
      expect(data.totalBalance).toBe("150.0000");
    });

    it("should reject reactivate on active budget", async () => {
      const active = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Active",
        balance: 50,
        totalBalance: 100,
      });

      const res = await client.api.budgets[":id"].reactivate.$post(
        {
          param: { id: active.id },
          json: { use_same_amount: true },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });

  describe("GET /budgets/:id/records", () => {
    it("should return paginated expense records for a budget", async () => {
      const budgetData = await seedBudget(testDatabase.db, {
        walletId: walletBId,
        name: "Records Budget",
        balance: 100,
        totalBalance: 100,
      });

      await client.api.records.$post(
        {
          json: {
            source_id: budgetData.id,
            source_type: "BUDGET",
            record_type: "EXPENSE",
            recorded_at: "2026-04-01T12:00:00.000Z",
            note: "Coffee",
            items: [{ amount: 15 }],
          },
        },
        { headers: authHeaders }
      );

      const res = await client.api.budgets[":id"].records.$get(
        {
          param: { id: budgetData.id },
          query: { limit: "10", offset: "0" },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data.records).toHaveLength(1);
      expect(data.records[0].sourceType).toBe("BUDGET");
      expect(data.pagination.total).toBe(1);
    });
  });

  describe("Auth", () => {
    it("should reject unauthenticated requests", async () => {
      const res = await client.api.budgets.$get({ query: {} });
      await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
    });
  });
});
