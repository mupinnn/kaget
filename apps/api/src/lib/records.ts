import { and, eq } from "drizzle-orm";
import type { Database, DbExecutor } from "../db/client";
import { record, recordTypeEnum, wallet } from "../db/schema";
import { assertOwnedBudget } from "./budgets";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";

export type RecordType = (typeof recordTypeEnum.enumValues)[number];

type RecordWithItems = {
  id: string;
  note: string | null;
  amount: string;
  sourceId: string;
  sourceType: "WALLET" | "BUDGET";
  recordType: RecordType;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    recordId: string;
    note: string | null;
    amount: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type OwnedWalletRecord = RecordWithItems & {
  sourceType: "WALLET";
  wallet: typeof wallet.$inferSelect;
};

export type OwnedBudgetRecord = RecordWithItems & {
  sourceType: "BUDGET";
  budget: Awaited<ReturnType<typeof assertOwnedBudget>>;
};

export type OwnedRecord = OwnedWalletRecord | OwnedBudgetRecord;

const BALANCE_IMPACT: Record<RecordType, number> = {
  INCOME: 1,
  EXPENSE: -1,
  DEBT: 1,
  DEBT_REPAYMENT: -1,
  LOAN: -1,
  LOAN_COLLECTION: 1,
};

export function getBalanceDelta(recordType: RecordType, amount: number): number {
  return BALANCE_IMPACT[recordType] * amount;
}

export function sumItemAmounts(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function parseAmount(value: string): number {
  return Number.parseFloat(value);
}

export function formatAmount(amount: number): string {
  return amount.toFixed(4);
}

export async function assertOwnedWallet(db: DbExecutor, userId: string, walletId: string) {
  const walletData = await db.query.wallet.findFirst({
    where: and(eq(wallet.id, walletId), eq(wallet.userId, userId)),
  });

  if (!walletData) {
    throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet does not exist");
  }

  return walletData;
}

export async function loadOwnedRecord(
  db: Database,
  userId: string,
  recordId: string
): Promise<OwnedRecord> {
  const recordData = await db.query.record.findFirst({
    where: eq(record.id, recordId),
    with: {
      items: true,
    },
  });

  if (!recordData) {
    throw new AppError(404, ERROR_CODES.RECORD.NOT_FOUND, "Record does not exist");
  }

  if (recordData.sourceType === "WALLET") {
    const walletData = await db.query.wallet.findFirst({
      where: and(eq(wallet.id, recordData.sourceId), eq(wallet.userId, userId)),
    });

    if (!walletData) {
      throw new AppError(404, ERROR_CODES.RECORD.NOT_FOUND, "Record does not exist");
    }

    return {
      ...recordData,
      sourceType: "WALLET" as const,
      wallet: walletData,
    };
  }

  if (recordData.sourceType === "BUDGET") {
    const budgetData = await assertOwnedBudget(db, userId, recordData.sourceId);

    return {
      ...recordData,
      sourceType: "BUDGET" as const,
      budget: budgetData,
    };
  }

  throw new AppError(404, ERROR_CODES.RECORD.NOT_FOUND, "Record does not exist");
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function applyWalletBalanceDelta(
  tx: Transaction,
  walletId: string,
  delta: number,
  now: Date
) {
  const walletData = await tx.query.wallet.findFirst({
    where: eq(wallet.id, walletId),
  });

  if (!walletData) {
    throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet does not exist");
  }

  const newBalance = parseAmount(walletData.balance) + delta;

  await tx
    .update(wallet)
    .set({
      balance: formatAmount(newBalance),
      updatedAt: now,
    })
    .where(eq(wallet.id, walletId));
}
