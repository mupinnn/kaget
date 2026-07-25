import { and, eq, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database, DbExecutor } from "../db/client";
import { record, recordItem, type sourceTypeEnum, transfer, wallet } from "../db/schema";
import {
  applyBudgetBalanceDelta,
  assertOwnedBudget,
  getUserBudgetIds,
  isBudgetOwnedByUser,
} from "./budgets";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";
import { applyWalletBalanceDelta, assertOwnedWallet, formatAmount, parseAmount } from "./records";

export type SourceType = (typeof sourceTypeEnum.enumValues)[number];

export type ResolvedAccount = {
  id: string;
  type: SourceType;
  name: string;
  balance: number;
  archivedAt?: Date | null;
  totalBalance?: number;
};

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function resolveAccount(
  db: DbExecutor,
  userId: string,
  id: string,
  type: SourceType
): Promise<ResolvedAccount> {
  if (type === "WALLET") {
    const walletData = await assertOwnedWallet(db, userId, id);
    return {
      id: walletData.id,
      type: "WALLET",
      name: walletData.name,
      balance: parseAmount(walletData.balance),
    };
  }

  const budgetData = await assertOwnedBudget(db, userId, id);
  return {
    id: budgetData.id,
    type: "BUDGET",
    name: budgetData.name,
    balance: parseAmount(budgetData.balance),
    archivedAt: budgetData.archivedAt,
    totalBalance: parseAmount(budgetData.totalBalance),
  };
}

export function validateTransferRules(
  sender: ResolvedAccount,
  receiver: ResolvedAccount,
  amount: number,
  fee: number
) {
  if (sender.id === receiver.id && sender.type === receiver.type) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      "Cannot transfer to same account"
    );
  }

  if (sender.type === "BUDGET" && receiver.type === "BUDGET") {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      "Budget to budget transfers not supported"
    );
  }

  if (amount <= 0) {
    throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Amount must be positive");
  }

  if (fee < 0) {
    throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Fee cannot be negative");
  }

  const totalDeduction = amount + fee;
  if (sender.balance < totalDeduction) {
    throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Insufficient balance");
  }

  if (receiver.type === "BUDGET") {
    if (receiver.archivedAt) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION.INVALID_INPUT,
        "Cannot transfer to archived budget"
      );
    }

    const totalBalance = receiver.totalBalance ?? 0;
    const newBalance = receiver.balance + amount;
    if (newBalance > totalBalance) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION.INVALID_INPUT,
        "Transfer would exceed budget allocation"
      );
    }
  }
}

export async function getUserAccountScope(db: Database, userId: string) {
  const wallets = await db.query.wallet.findMany({
    where: eq(wallet.userId, userId),
    columns: { id: true },
  });
  const budgetIds = await getUserBudgetIds(db, userId);

  return {
    walletIds: wallets.map(w => w.id),
    budgetIds,
  };
}

async function isTransferOwnedByUser(
  db: Database,
  userId: string,
  sourceId: string,
  sourceType: SourceType
) {
  if (sourceType === "WALLET") {
    const walletData = await db.query.wallet.findFirst({
      where: eq(wallet.id, sourceId),
      columns: { userId: true },
    });
    return walletData?.userId === userId;
  }

  return isBudgetOwnedByUser(db, userId, sourceId);
}

export async function loadOwnedTransfer(db: Database, userId: string, transferId: string) {
  const transferData = await db.query.transfer.findFirst({
    where: eq(transfer.id, transferId),
  });

  if (!transferData) {
    throw new AppError(404, ERROR_CODES.TRANSFER.NOT_FOUND, "Transfer does not exist");
  }

  const owned = await isTransferOwnedByUser(
    db,
    userId,
    transferData.sourceId,
    transferData.sourceType
  );
  if (!owned) {
    throw new AppError(404, ERROR_CODES.TRANSFER.NOT_FOUND, "Transfer does not exist");
  }

  return transferData;
}

export async function loadPairedTransfer(db: Database, refId: string, excludeId: string) {
  return db.query.transfer.findFirst({
    where: and(eq(transfer.refId, refId), ne(transfer.id, excludeId)),
  });
}

async function applyAccountBalanceDelta(
  tx: Transaction,
  account: ResolvedAccount,
  delta: number,
  now: Date
) {
  if (account.type === "WALLET") {
    await applyWalletBalanceDelta(tx, account.id, delta, now);
  } else {
    await applyBudgetBalanceDelta(tx, account.id, delta, now);
  }
}

export async function createFeeExpenseRecord(
  tx: Transaction,
  params: {
    sender: ResolvedAccount;
    receiver: ResolvedAccount;
    fee: number;
    transferredAt: Date;
    now: Date;
  }
) {
  const { sender, receiver, fee, transferredAt, now } = params;
  const recordId = nanoid();

  await tx.insert(record).values({
    id: recordId,
    note: `Transfer fee to ${receiver.name}`,
    amount: formatAmount(fee),
    sourceId: sender.id,
    sourceType: sender.type,
    recordType: "EXPENSE",
    recordedAt: transferredAt,
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(recordItem).values({
    id: nanoid(),
    recordId,
    note: "Transfer fee",
    amount: formatAmount(fee),
    createdAt: now,
    updatedAt: now,
  });
}

export type CreateTransferPairParams = {
  sender: ResolvedAccount;
  receiver: ResolvedAccount;
  amount: number;
  fee: number;
  note?: string;
  transferredAt: Date;
  now: Date;
};

export async function createTransferPair(tx: Transaction, params: CreateTransferPairParams) {
  const { sender, receiver, amount, fee, note, transferredAt, now } = params;
  const refId = nanoid();
  const outgoingId = nanoid();
  const incomingId = nanoid();
  const formattedAmount = formatAmount(amount);
  const formattedFee = formatAmount(fee);

  await tx.insert(transfer).values({
    id: outgoingId,
    note: note ?? null,
    amount: formattedAmount,
    fee: formattedFee,
    sourceId: sender.id,
    sourceType: sender.type,
    sourceName: sender.name,
    destinationId: receiver.id,
    destinationType: receiver.type,
    destinationName: receiver.name,
    type: "OUTGOING",
    refId,
    transferredAt,
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(transfer).values({
    id: incomingId,
    note: note ?? null,
    amount: formattedAmount,
    fee: formatAmount(0),
    sourceId: receiver.id,
    sourceType: receiver.type,
    sourceName: receiver.name,
    destinationId: sender.id,
    destinationType: sender.type,
    destinationName: sender.name,
    type: "INCOMING",
    refId,
    transferredAt,
    createdAt: now,
    updatedAt: now,
  });

  const totalDeduction = amount + fee;
  await applyAccountBalanceDelta(tx, sender, -totalDeduction, now);
  await applyAccountBalanceDelta(tx, receiver, amount, now);

  if (fee > 0) {
    await createFeeExpenseRecord(tx, { sender, receiver, fee, transferredAt, now });
  }

  return outgoingId;
}
