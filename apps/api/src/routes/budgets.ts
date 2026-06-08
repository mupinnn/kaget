import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import * as z from "zod";
import type { Database } from "../db/client";
import { budget, record, wallet } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import {
  archiveBudgetIfZero,
  assertBudgetActive,
  assertOwnedBudget,
  type BudgetCreateInput,
  buildInitialBudgetValues,
  getWalletDeductionForCreate,
  toBudgetDetail,
  validateAddFunds,
  validateRefundAmount,
} from "../lib/budgets";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { assertOwnedWallet, formatAmount, parseAmount } from "../lib/records";
import { createTransferPair, resolveAccount, validateTransferRules } from "../lib/transfers";
import { validator } from "../lib/validator";

const budgetCreateItemSchema = z.object({
  name: z.string().min(1, "Budget name is required").max(255).trim(),
  wallet_id: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  budget_type: z.enum(["BUDGET", "GOAL"]).optional().default("BUDGET"),
  initial_contribution: z.coerce
    .number()
    .min(0, "Initial contribution cannot be negative")
    .optional(),
});

const createBudgetSchema = budgetCreateItemSchema;

const bulkCreateBudgetSchema = z.object({
  budgets: z.array(budgetCreateItemSchema).min(1, "At least one budget is required"),
});

const listBudgetsQuerySchema = z.object({
  wallet_id: z.string().min(1).optional(),
  budget_type: z.enum(["BUDGET", "GOAL"]).optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform(v => (v === undefined ? undefined : v === "true")),
});

const amountSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

const reactivateBudgetSchema = z
  .object({
    amount: z.coerce.number().positive("Amount must be positive").optional(),
    use_same_amount: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (!data.use_same_amount && data.amount === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Amount is required when use_same_amount is false",
        path: ["amount"],
      });
    }
  });

const listBudgetRecordsQuerySchema = z.object({
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

async function getUserWalletIds(db: Database, userId: string) {
  const wallets = await db.query.wallet.findMany({
    where: eq(wallet.userId, userId),
    columns: { id: true },
  });

  return wallets.map(w => w.id);
}

function buildListConditions(walletIds: string[], query: z.infer<typeof listBudgetsQuerySchema>) {
  const conditions = [inArray(budget.walletId, walletIds)];

  if (query.wallet_id) {
    conditions.push(eq(budget.walletId, query.wallet_id));
  }

  if (query.budget_type) {
    conditions.push(eq(budget.budgetType, query.budget_type));
  }

  if (query.archived === true) {
    conditions.push(isNotNull(budget.archivedAt));
  } else if (query.archived === false) {
    conditions.push(isNull(budget.archivedAt));
  }

  return and(...conditions);
}

async function validateWalletDeductions(db: Database, userId: string, items: BudgetCreateInput[]) {
  const deductionsByWallet = new Map<string, number>();

  for (const item of items) {
    const deduction = getWalletDeductionForCreate(item);
    const current = deductionsByWallet.get(item.wallet_id) ?? 0;
    deductionsByWallet.set(item.wallet_id, current + deduction);
  }

  for (const [walletId, totalDeduction] of deductionsByWallet) {
    if (totalDeduction === 0) {
      continue;
    }

    const walletData = await assertOwnedWallet(db, userId, walletId);
    const walletBalance = parseAmount(walletData.balance);

    if (walletBalance < totalDeduction) {
      throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Insufficient wallet balance");
    }
  }
}

async function createBudgetWithTransfer(
  tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
  userId: string,
  item: BudgetCreateInput,
  now: Date
) {
  const budgetId = nanoid();
  const initialValues = buildInitialBudgetValues(item);
  const deduction = getWalletDeductionForCreate(item);

  await tx.insert(budget).values({
    id: budgetId,
    name: item.name,
    walletId: item.wallet_id,
    balance: initialValues.balance,
    totalBalance: initialValues.totalBalance,
    budgetType: initialValues.budgetType,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  if (deduction > 0) {
    const sender = await resolveAccount(tx, userId, item.wallet_id, "WALLET");
    const receiver = await resolveAccount(tx, userId, budgetId, "BUDGET");

    validateTransferRules(sender, receiver, deduction, 0);

    await createTransferPair(tx, {
      sender,
      receiver,
      amount: deduction,
      fee: 0,
      note: `Budget allocation for ${item.name}`,
      transferredAt: now,
      now,
    });
  }

  const created = await tx.query.budget.findFirst({
    where: eq(budget.id, budgetId),
  });

  return toBudgetDetail(created!);
}

export function createBudgetRoutes(db: Database, _auth: Auth) {
  return new Hono()
    .post("/bulk", validator("json", bulkCreateBudgetSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const { budgets: items } = c.req.valid("json");
      const now = new Date();

      await validateWalletDeductions(db, user.id, items);

      const createdBudgets = await db.transaction(async tx => {
        const results = [];

        for (const item of items) {
          const created = await createBudgetWithTransfer(tx, user.id, item, now);
          results.push(created);
        }

        return results;
      });

      wideEvent.budget = { count: createdBudgets.length, bulk: true };

      return c.json({ data: createdBudgets }, 201);
    })

    .post("/", validator("json", createBudgetSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const body = c.req.valid("json");
      const now = new Date();

      await validateWalletDeductions(db, user.id, [body]);

      const createdBudget = await db.transaction(async tx =>
        createBudgetWithTransfer(tx, user.id, body, now)
      );

      wideEvent.budget = { id: createdBudget.id, budget_type: createdBudget.budgetType };

      return c.json({ data: createdBudget }, 201);
    })

    .get("/", validator("query", listBudgetsQuerySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const query = c.req.valid("query");

      const walletIds = await getUserWalletIds(db, user.id);

      if (query.wallet_id) {
        await assertOwnedWallet(db, user.id, query.wallet_id);
      }

      if (walletIds.length === 0) {
        wideEvent.budget = { count: 0 };
        return c.json({ data: [] });
      }

      const conditions = buildListConditions(walletIds, query);

      const budgets = await db.query.budget.findMany({
        where: conditions,
        orderBy: [desc(budget.updatedAt)],
      });

      const data = budgets.map(toBudgetDetail);

      wideEvent.budget = { count: data.length };

      return c.json({ data });
    })

    .get("/:id/records", validator("query", listBudgetRecordsQuerySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const budgetId = c.req.param("id");
      const query = c.req.valid("query");

      await assertOwnedBudget(db, user.id, budgetId);

      const conditions = [
        eq(record.sourceId, budgetId),
        eq(record.sourceType, "BUDGET"),
        eq(record.recordType, "EXPENSE"),
      ];

      if (query.from_date) {
        conditions.push(gte(record.recordedAt, query.from_date));
      }

      if (query.to_date) {
        const endOfDay = new Date(query.to_date);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(lte(record.recordedAt, endOfDay));
      }

      const whereClause = and(...conditions);

      const [totalResult] = await db.select({ total: count() }).from(record).where(whereClause);

      const records = await db.query.record.findMany({
        where: whereClause,
        with: { items: true },
        orderBy: [desc(record.recordedAt)],
        limit: query.limit,
        offset: query.offset,
      });

      wideEvent.budget = { id: budgetId, record_count: records.length };

      return c.json({
        data: {
          records,
          pagination: {
            total: totalResult.total,
            limit: query.limit,
            offset: query.offset,
          },
        },
      });
    })

    .get("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const budgetId = c.req.param("id");

      const budgetData = await assertOwnedBudget(db, user.id, budgetId);

      wideEvent.budget = { id: budgetId };

      return c.json({ data: toBudgetDetail(budgetData) });
    })

    .post("/:id/add-funds", validator("json", amountSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const budgetId = c.req.param("id");
      const { amount } = c.req.valid("json");
      const now = new Date();

      const budgetData = await assertOwnedBudget(db, user.id, budgetId);
      assertBudgetActive(budgetData, "add");
      validateAddFunds(budgetData, amount);

      const walletData = await assertOwnedWallet(db, user.id, budgetData.walletId);
      const walletBalance = parseAmount(walletData.balance);

      if (walletBalance < amount) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION.INVALID_INPUT,
          "Insufficient wallet balance"
        );
      }

      await db.transaction(async tx => {
        const sender = await resolveAccount(tx, user.id, budgetData.walletId, "WALLET");
        const receiver = await resolveAccount(tx, user.id, budgetId, "BUDGET");

        validateTransferRules(sender, receiver, amount, 0);

        await createTransferPair(tx, {
          sender,
          receiver,
          amount,
          fee: 0,
          note: `Add funds to ${budgetData.name}`,
          transferredAt: now,
          now,
        });
      });

      const updated = await assertOwnedBudget(db, user.id, budgetId);

      wideEvent.budget = { id: budgetId, action: "add-funds", amount };

      return c.json({ data: toBudgetDetail(updated) });
    })

    .post("/:id/refund", validator("json", amountSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const budgetId = c.req.param("id");
      const { amount } = c.req.valid("json");
      const now = new Date();

      const budgetData = await assertOwnedBudget(db, user.id, budgetId);
      assertBudgetActive(budgetData, "refund");
      validateRefundAmount(budgetData, amount);

      await db.transaction(async tx => {
        const sender = await resolveAccount(tx, user.id, budgetId, "BUDGET");
        const receiver = await resolveAccount(tx, user.id, budgetData.walletId, "WALLET");

        validateTransferRules(sender, receiver, amount, 0);

        await createTransferPair(tx, {
          sender,
          receiver,
          amount,
          fee: 0,
          note: `Refund from ${budgetData.name}`,
          transferredAt: now,
          now,
        });

        await archiveBudgetIfZero(tx, budgetId, now);
      });

      const updated = await assertOwnedBudget(db, user.id, budgetId);

      wideEvent.budget = { id: budgetId, action: "refund", amount };

      return c.json({ data: toBudgetDetail(updated) });
    })

    .post("/:id/reactivate", validator("json", reactivateBudgetSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const budgetId = c.req.param("id");
      const body = c.req.valid("json");
      const now = new Date();

      const budgetData = await assertOwnedBudget(db, user.id, budgetId);

      if (!budgetData.archivedAt) {
        throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Budget is not archived");
      }

      const totalBalance = parseAmount(budgetData.totalBalance);
      const reactivateAmount = body.use_same_amount ? totalBalance : body.amount!;

      const walletData = await assertOwnedWallet(db, user.id, budgetData.walletId);
      const walletBalance = parseAmount(walletData.balance);

      if (walletBalance < reactivateAmount) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION.INVALID_INPUT,
          "Insufficient wallet balance"
        );
      }

      await db.transaction(async tx => {
        await tx
          .update(budget)
          .set({
            archivedAt: null,
            balance: formatAmount(0),
            ...(body.use_same_amount ? {} : { totalBalance: formatAmount(reactivateAmount) }),
            updatedAt: now,
          })
          .where(eq(budget.id, budgetId));

        const sender = await resolveAccount(tx, user.id, budgetData.walletId, "WALLET");
        const receiver = await resolveAccount(tx, user.id, budgetId, "BUDGET");

        validateTransferRules(sender, receiver, reactivateAmount, 0);

        await createTransferPair(tx, {
          sender,
          receiver,
          amount: reactivateAmount,
          fee: 0,
          note: `Reactivate ${budgetData.name}`,
          transferredAt: now,
          now,
        });
      });

      const updated = await assertOwnedBudget(db, user.id, budgetId);

      wideEvent.budget = { id: budgetId, action: "reactivate" };

      return c.json({ data: toBudgetDetail(updated) });
    });
}
