import { nanoid } from "nanoid";
import type { Budget } from "@/features/budgets/data/budgets.schemas";
import type {
  Record as LedgerRecord,
  RecordItem,
  RecordType,
  SourceType,
} from "@/features/records/data/records.schemas";
import type { Transfer } from "@/features/transfers/data/transfers.schemas";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { BadRequestError, NotFoundError } from "@/utils/error.util";
import { db } from "./db.lib";

export const BALANCE_IMPACT: Record<RecordType, number> = {
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

export type ResolvedAccount = {
  id: string;
  type: SourceType;
  name: string;
  balance: number;
  archivedAt?: Date | null;
  totalBalance?: number;
};

export async function assertWallet(walletId: string): Promise<Wallet> {
  const wallet = await db.wallets.get(walletId);
  if (!wallet) {
    throw new NotFoundError("Wallet does not exist");
  }
  return wallet;
}

export async function assertBudget(budgetId: string): Promise<Budget> {
  const budget = await db.budgets.get(budgetId);
  if (!budget) {
    throw new NotFoundError("Budget does not exist");
  }
  return budget;
}

export function toBudgetDetail(budget: Budget) {
  const usedAmount = budget.totalBalance - budget.balance;
  const usedPercentage = budget.totalBalance > 0 ? (usedAmount / budget.totalBalance) * 100 : 0;
  const isReached =
    budget.budgetType === "GOAL" &&
    budget.balance === budget.totalBalance &&
    budget.totalBalance > 0;

  return {
    ...budget,
    usedAmount,
    usedPercentage,
    isReached,
  };
}

export function assertBudgetActive(budget: Budget, operation: "add" | "refund" | "spend") {
  if (!budget.archivedAt) {
    return;
  }

  const messages = {
    add: "Cannot add to archived budget",
    refund: "Cannot refund from archived budget",
    spend: "Cannot spend from archived budget",
  };

  throw new BadRequestError(messages[operation]);
}

export function validateAddFunds(budget: Budget, amount: number) {
  const maxAddable = budget.totalBalance - budget.balance;
  if (amount > maxAddable) {
    const message =
      budget.budgetType === "GOAL"
        ? "Contribution exceeds remaining target"
        : "Cannot exceed original allocation";
    throw new BadRequestError(message);
  }
}

export function validateGoalSpendable(budget: Budget) {
  if (budget.budgetType !== "GOAL") {
    return;
  }
  if (budget.balance < budget.totalBalance) {
    throw new BadRequestError("Goal must be reached before spending");
  }
}

export function validateRefundAmount(budget: Budget, amount: number) {
  if (amount > budget.balance) {
    throw new BadRequestError("Refund amount exceeds balance");
  }
}

export async function applyWalletBalanceDelta(walletId: string, delta: number, now: Date) {
  const wallet = await assertWallet(walletId);
  await db.wallets.update(walletId, {
    balance: wallet.balance + delta,
    updatedAt: now,
  });
}

export async function applyBudgetBalanceDelta(budgetId: string, delta: number, now: Date) {
  const budget = await assertBudget(budgetId);
  await db.budgets.update(budgetId, {
    balance: budget.balance + delta,
    updatedAt: now,
  });
}

export async function archiveBudgetIfZero(budgetId: string, now: Date) {
  const budget = await db.budgets.get(budgetId);
  if (!budget) {
    return;
  }
  if (budget.balance === 0) {
    await db.budgets.update(budgetId, {
      archivedAt: now,
      updatedAt: now,
    });
  }
}

export async function resolveAccount(id: string, type: SourceType): Promise<ResolvedAccount> {
  if (type === "WALLET") {
    const wallet = await assertWallet(id);
    return {
      id: wallet.id,
      type: "WALLET",
      name: wallet.name,
      balance: wallet.balance,
    };
  }

  const budget = await assertBudget(id);
  return {
    id: budget.id,
    type: "BUDGET",
    name: budget.name,
    balance: budget.balance,
    archivedAt: budget.archivedAt,
    totalBalance: budget.totalBalance,
  };
}

export function validateTransferRules(
  sender: ResolvedAccount,
  receiver: ResolvedAccount,
  amount: number,
  fee: number
) {
  if (sender.id === receiver.id && sender.type === receiver.type) {
    throw new BadRequestError("Cannot transfer to same account");
  }

  if (sender.type === "BUDGET" && receiver.type === "BUDGET") {
    throw new BadRequestError("Budget to budget transfers not supported");
  }

  if (amount <= 0) {
    throw new BadRequestError("Amount must be positive");
  }

  if (fee < 0) {
    throw new BadRequestError("Fee cannot be negative");
  }

  if (sender.balance < amount + fee) {
    throw new BadRequestError("Insufficient balance");
  }

  if (receiver.type === "BUDGET") {
    if (receiver.archivedAt) {
      throw new BadRequestError("Cannot transfer to archived budget");
    }

    const totalBalance = receiver.totalBalance ?? 0;
    if (receiver.balance + amount > totalBalance) {
      throw new BadRequestError("Transfer would exceed budget allocation");
    }
  }
}

async function applyAccountBalanceDelta(account: ResolvedAccount, delta: number, now: Date) {
  if (account.type === "WALLET") {
    await applyWalletBalanceDelta(account.id, delta, now);
  } else {
    await applyBudgetBalanceDelta(account.id, delta, now);
  }
}

async function createFeeExpenseRecord(params: {
  sender: ResolvedAccount;
  receiver: ResolvedAccount;
  fee: number;
  transferredAt: Date;
  now: Date;
}) {
  const { sender, receiver, fee, transferredAt, now } = params;
  const recordId = nanoid();

  const feeRecord: LedgerRecord = {
    id: recordId,
    note: `Transfer fee to ${receiver.name}`,
    amount: fee,
    sourceId: sender.id,
    sourceType: sender.type,
    recordType: "EXPENSE",
    recordedAt: transferredAt,
    createdAt: now,
    updatedAt: now,
  };

  const feeItem: RecordItem = {
    id: nanoid(),
    recordId,
    note: "Transfer fee",
    amount: fee,
    createdAt: now,
    updatedAt: now,
  };

  await db.records.add(feeRecord);
  await db.recordItems.add(feeItem);
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

export async function createTransferPair(params: CreateTransferPairParams) {
  const { sender, receiver, amount, fee, note, transferredAt, now } = params;
  const refId = nanoid();
  const outgoingId = nanoid();
  const incomingId = nanoid();

  const outgoing: Transfer = {
    id: outgoingId,
    note: note ?? null,
    amount,
    fee,
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
  };

  const incoming: Transfer = {
    id: incomingId,
    note: note ?? null,
    amount,
    fee: 0,
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
  };

  await db.transfers.bulkAdd([outgoing, incoming]);
  await applyAccountBalanceDelta(sender, -(amount + fee), now);
  await applyAccountBalanceDelta(receiver, amount, now);

  if (fee > 0) {
    await createFeeExpenseRecord({ sender, receiver, fee, transferredAt, now });
  }

  return outgoingId;
}

export async function deleteRecordItemsForRecordIds(recordIds: string[]) {
  if (recordIds.length === 0) {
    return;
  }
  await db.recordItems.where("recordId").anyOf(recordIds).delete();
}

export async function loadRecordWithItems(recordId: string) {
  const record = await db.records.get(recordId);
  if (!record) {
    throw new NotFoundError("Record does not exist");
  }
  const items = await db.recordItems.where("recordId").equals(recordId).toArray();
  return { ...record, items };
}
