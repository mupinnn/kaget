import { and, eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { budget, wallet } from "../db/schema";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";
import { formatAmount, parseAmount } from "./records";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function assertOwnedBudget(db: Database, userId: string, budgetId: string) {
  const budgetData = await db.query.budget.findFirst({
    where: eq(budget.id, budgetId),
    with: { wallet: true },
  });

  if (!budgetData || budgetData.wallet.userId !== userId) {
    throw new AppError(404, ERROR_CODES.BUDGET.NOT_FOUND, "Budget does not exist");
  }

  return budgetData;
}

export async function applyBudgetBalanceDelta(
  tx: Transaction,
  budgetId: string,
  delta: number,
  now: Date
) {
  const budgetData = await tx.query.budget.findFirst({
    where: eq(budget.id, budgetId),
  });

  if (!budgetData) {
    throw new AppError(404, ERROR_CODES.BUDGET.NOT_FOUND, "Budget does not exist");
  }

  const newBalance = parseAmount(budgetData.balance) + delta;

  await tx
    .update(budget)
    .set({
      balance: formatAmount(newBalance),
      updatedAt: now,
    })
    .where(eq(budget.id, budgetId));
}

export async function getUserBudgetIds(db: Database, userId: string) {
  const budgets = await db
    .select({ id: budget.id })
    .from(budget)
    .innerJoin(wallet, eq(budget.walletId, wallet.id))
    .where(eq(wallet.userId, userId));

  return budgets.map(b => b.id);
}

export async function isBudgetOwnedByUser(db: Database, userId: string, budgetId: string) {
  const row = await db
    .select({ id: budget.id })
    .from(budget)
    .innerJoin(wallet, eq(budget.walletId, wallet.id))
    .where(and(eq(budget.id, budgetId), eq(wallet.userId, userId)))
    .limit(1);

  return row.length > 0;
}
