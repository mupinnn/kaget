import { and, eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { record, recordTypeEnum, wallet } from "../db/schema";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";

export type RecordType = (typeof recordTypeEnum.enumValues)[number];

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

export async function assertOwnedWallet(db: Database, userId: string, walletId: string) {
  const walletData = await db.query.wallet.findFirst({
    where: and(eq(wallet.id, walletId), eq(wallet.userId, userId)),
  });

  if (!walletData) {
    throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet does not exist");
  }

  return walletData;
}

export async function loadOwnedRecord(db: Database, userId: string, recordId: string) {
  const recordData = await db.query.record.findFirst({
    where: eq(record.id, recordId),
    with: {
      items: true,
    },
  });

  if (!recordData || recordData.sourceType !== "WALLET") {
    throw new AppError(404, ERROR_CODES.RECORD.NOT_FOUND, "Record does not exist");
  }

  const walletData = await db.query.wallet.findFirst({
    where: and(eq(wallet.id, recordData.sourceId), eq(wallet.userId, userId)),
  });

  if (!walletData) {
    throw new AppError(404, ERROR_CODES.RECORD.NOT_FOUND, "Record does not exist");
  }

  return {
    ...recordData,
    wallet: walletData,
  };
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
