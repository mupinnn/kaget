import { and, eq } from "drizzle-orm";
import type { Database, DbExecutor } from "../db/client";
import { budget, wallet } from "../db/schema";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";
import { formatAmount, parseAmount } from "./records";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

type BudgetRow = typeof budget.$inferSelect;

export type BudgetCreateInput = {
  name: string;
  wallet_id: string;
  amount: number;
  budget_type: "BUDGET" | "GOAL";
  initial_contribution?: number;
};

export function toBudgetDetail(budgetData: BudgetRow) {
  const balance = parseAmount(budgetData.balance);
  const totalBalance = parseAmount(budgetData.totalBalance);
  const usedAmount = totalBalance - balance;
  const usedPercentage = totalBalance > 0 ? (usedAmount / totalBalance) * 100 : 0;
  const isReached =
    budgetData.budgetType === "GOAL" && balance === totalBalance && totalBalance > 0;

  return {
    ...budgetData,
    usedAmount,
    usedPercentage,
    isReached,
  };
}

export function assertBudgetActive(budgetData: BudgetRow, operation: "add" | "refund" | "spend") {
  if (!budgetData.archivedAt) {
    return;
  }

  const messages = {
    add: "Cannot add to archived budget",
    refund: "Cannot refund from archived budget",
    spend: "Cannot spend from archived budget",
  };

  throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, messages[operation]);
}

export function validateAddFunds(budgetData: BudgetRow, amount: number) {
  const balance = parseAmount(budgetData.balance);
  const totalBalance = parseAmount(budgetData.totalBalance);
  const maxAddable = totalBalance - balance;

  if (amount > maxAddable) {
    const message =
      budgetData.budgetType === "GOAL"
        ? "Contribution exceeds remaining target"
        : "Cannot exceed original allocation";
    throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, message);
  }
}

export function validateGoalSpendable(budgetData: BudgetRow) {
  if (budgetData.budgetType !== "GOAL") {
    return;
  }

  const balance = parseAmount(budgetData.balance);
  const totalBalance = parseAmount(budgetData.totalBalance);

  if (balance < totalBalance) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      "Goal must be reached before spending"
    );
  }
}

export function validateRefundAmount(budgetData: BudgetRow, amount: number) {
  const balance = parseAmount(budgetData.balance);

  if (amount > balance) {
    throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Refund amount exceeds balance");
  }
}

export function getWalletDeductionForCreate(item: BudgetCreateInput): number {
  if (item.budget_type === "GOAL") {
    return item.initial_contribution ?? 0;
  }

  return item.amount;
}

export function buildInitialBudgetValues(item: BudgetCreateInput) {
  return {
    balance: formatAmount(0),
    totalBalance: formatAmount(item.amount),
    budgetType: item.budget_type,
  };
}

export async function archiveBudgetIfZero(tx: Transaction, budgetId: string, now: Date) {
  const budgetData = await tx.query.budget.findFirst({
    where: eq(budget.id, budgetId),
  });

  if (!budgetData) {
    return;
  }

  const balance = parseAmount(budgetData.balance);

  if (balance === 0) {
    await tx
      .update(budget)
      .set({
        archivedAt: now,
        updatedAt: now,
      })
      .where(eq(budget.id, budgetId));
  }
}

export async function assertOwnedBudget(db: DbExecutor, userId: string, budgetId: string) {
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
