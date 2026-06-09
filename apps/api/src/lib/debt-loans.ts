import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database, DbExecutor } from "../db/client";
import { debtLoan, type debtLoanTypeEnum, record, recordItem, wallet } from "../db/schema";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";
import {
  applyWalletBalanceDelta,
  assertOwnedWallet,
  formatAmount,
  getBalanceDelta,
  parseAmount,
  type RecordType,
} from "./records";

export type DebtLoanType = (typeof debtLoanTypeEnum.enumValues)[number];

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

type DebtLoanRow = typeof debtLoan.$inferSelect;
type WalletRow = typeof wallet.$inferSelect;

export type DebtLoanCreateInput = {
  type: DebtLoanType;
  wallet_id: string;
  amount: number;
  other_party: string;
  occurred_at: Date;
  note?: string;
};

export type DebtLoanUpdateInput = {
  note?: string | null;
  other_party?: string;
  amount?: number;
  occurred_at?: Date;
};

const INITIAL_RECORD_TYPE: Record<DebtLoanType, RecordType> = {
  DEBT: "DEBT",
  LOAN: "LOAN",
};

const RESOLUTION_RECORD_TYPE: Record<DebtLoanType, RecordType> = {
  DEBT: "DEBT_REPAYMENT",
  LOAN: "LOAN_COLLECTION",
};

function getDefaultNote(type: DebtLoanType, otherParty: string): string {
  return type === "DEBT" ? `Borrowed from ${otherParty}` : `Lent to ${otherParty}`;
}

function getResolutionNote(type: DebtLoanType, otherParty: string): string {
  return type === "DEBT" ? `Repaid ${otherParty}` : `Collected from ${otherParty}`;
}

function assertPending(debtLoanData: DebtLoanRow) {
  if (debtLoanData.resolvedAt) {
    throw new AppError(
      400,
      ERROR_CODES.DEBT_LOAN.ALREADY_RESOLVED,
      "Debt/loan is already resolved"
    );
  }
}

function assertLoanBalance(walletData: WalletRow, amount: number) {
  if (parseAmount(walletData.balance) < amount) {
    throw new AppError(400, ERROR_CODES.DEBT_LOAN.INSUFFICIENT_BALANCE, "Insufficient balance");
  }
}

async function createLinkedRecord(
  tx: Transaction,
  {
    recordId,
    walletId,
    recordType,
    amount,
    note,
    recordedAt,
    now,
  }: {
    recordId: string;
    walletId: string;
    recordType: RecordType;
    amount: number;
    note: string;
    recordedAt: Date;
    now: Date;
  }
) {
  await tx.insert(record).values({
    id: recordId,
    note,
    amount: formatAmount(amount),
    sourceId: walletId,
    sourceType: "WALLET",
    recordType,
    recordedAt,
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(recordItem).values({
    id: nanoid(),
    recordId,
    note,
    amount: formatAmount(amount),
    createdAt: now,
    updatedAt: now,
  });
}

export async function assertOwnedDebtLoan(db: DbExecutor, userId: string, debtLoanId: string) {
  const debtLoanData = await db.query.debtLoan.findFirst({
    where: eq(debtLoan.id, debtLoanId),
    with: { wallet: true },
  });

  if (!debtLoanData || debtLoanData.wallet.userId !== userId) {
    throw new AppError(404, ERROR_CODES.DEBT_LOAN.NOT_FOUND, "Debt/loan not found");
  }

  return debtLoanData;
}

export async function createDebtLoan(
  tx: Transaction,
  walletData: WalletRow,
  input: DebtLoanCreateInput,
  now: Date
) {
  const { type, amount, other_party, occurred_at, note } = input;
  const recordNote = note ?? getDefaultNote(type, other_party);

  if (type === "LOAN") {
    assertLoanBalance(walletData, amount);
  }

  const recordId = nanoid();
  const debtLoanId = nanoid();

  await createLinkedRecord(tx, {
    recordId,
    walletId: walletData.id,
    recordType: INITIAL_RECORD_TYPE[type],
    amount,
    note: recordNote,
    recordedAt: occurred_at,
    now,
  });

  const delta = getBalanceDelta(INITIAL_RECORD_TYPE[type], amount);
  await applyWalletBalanceDelta(tx, walletData.id, delta, now);

  await tx.insert(debtLoan).values({
    id: debtLoanId,
    note: note ?? null,
    otherParty: other_party,
    amount: formatAmount(amount),
    type,
    sourceId: walletData.id,
    sourceType: "WALLET",
    initialRecordId: recordId,
    occurredAt: occurred_at,
    createdAt: now,
    updatedAt: now,
  });

  return debtLoanId;
}

export async function updateDebtLoan(
  tx: Transaction,
  debtLoanData: DebtLoanRow,
  walletData: WalletRow,
  input: DebtLoanUpdateInput,
  now: Date
) {
  assertPending(debtLoanData);

  const oldAmount = parseAmount(debtLoanData.amount);
  const newAmount = input.amount ?? oldAmount;
  const newOtherParty = input.other_party ?? debtLoanData.otherParty;
  const newOccurredAt = input.occurred_at ?? debtLoanData.occurredAt;
  const newNote = input.note !== undefined ? input.note : debtLoanData.note;

  if (input.amount !== undefined && newAmount !== oldAmount) {
    const oldDelta = getBalanceDelta(INITIAL_RECORD_TYPE[debtLoanData.type], oldAmount);
    const newDelta = getBalanceDelta(INITIAL_RECORD_TYPE[debtLoanData.type], newAmount);
    const netDelta = newDelta - oldDelta;

    if (debtLoanData.type === "LOAN" && netDelta < 0) {
      const currentBalance = parseAmount(walletData.balance);
      if (currentBalance < Math.abs(netDelta)) {
        throw new AppError(400, ERROR_CODES.DEBT_LOAN.INSUFFICIENT_BALANCE, "Insufficient balance");
      }
    }

    await applyWalletBalanceDelta(tx, walletData.id, netDelta, now);
  }

  const recordNote = newNote ?? getDefaultNote(debtLoanData.type, newOtherParty);

  await tx
    .update(debtLoan)
    .set({
      note: newNote,
      otherParty: newOtherParty,
      amount: formatAmount(newAmount),
      occurredAt: newOccurredAt,
      updatedAt: now,
    })
    .where(eq(debtLoan.id, debtLoanData.id));

  await tx
    .update(record)
    .set({
      note: recordNote,
      amount: formatAmount(newAmount),
      recordedAt: newOccurredAt,
      updatedAt: now,
    })
    .where(eq(record.id, debtLoanData.initialRecordId));

  await tx
    .update(recordItem)
    .set({
      note: recordNote,
      amount: formatAmount(newAmount),
      updatedAt: now,
    })
    .where(eq(recordItem.recordId, debtLoanData.initialRecordId));
}

export async function resolveDebtLoan(
  tx: Transaction,
  debtLoanData: DebtLoanRow,
  walletData: WalletRow,
  now: Date
) {
  assertPending(debtLoanData);

  const amount = parseAmount(debtLoanData.amount);
  const resolutionType = RESOLUTION_RECORD_TYPE[debtLoanData.type];

  if (debtLoanData.type === "DEBT") {
    if (parseAmount(walletData.balance) < amount) {
      throw new AppError(
        400,
        ERROR_CODES.DEBT_LOAN.INSUFFICIENT_BALANCE,
        "Insufficient balance for repayment"
      );
    }
  }

  const recordId = nanoid();
  const resolutionNote = getResolutionNote(debtLoanData.type, debtLoanData.otherParty);

  await createLinkedRecord(tx, {
    recordId,
    walletId: walletData.id,
    recordType: resolutionType,
    amount,
    note: resolutionNote,
    recordedAt: now,
    now,
  });

  const delta = getBalanceDelta(resolutionType, amount);
  await applyWalletBalanceDelta(tx, walletData.id, delta, now);

  await tx
    .update(debtLoan)
    .set({
      resolvedAt: now,
      resolvedRecordId: recordId,
      updatedAt: now,
    })
    .where(eq(debtLoan.id, debtLoanData.id));
}

export async function deleteDebtLoan(
  tx: Transaction,
  debtLoanData: DebtLoanRow,
  walletData: WalletRow,
  now: Date
) {
  const amount = parseAmount(debtLoanData.amount);
  let balanceAdjustment = 0;

  if (debtLoanData.resolvedRecordId) {
    await tx.delete(recordItem).where(eq(recordItem.recordId, debtLoanData.resolvedRecordId));
    await tx.delete(record).where(eq(record.id, debtLoanData.resolvedRecordId));

    if (debtLoanData.type === "DEBT") {
      balanceAdjustment += amount;
    } else {
      balanceAdjustment -= amount;
    }
  }

  await tx.delete(recordItem).where(eq(recordItem.recordId, debtLoanData.initialRecordId));
  await tx.delete(record).where(eq(record.id, debtLoanData.initialRecordId));

  if (debtLoanData.type === "DEBT") {
    balanceAdjustment -= amount;
  } else {
    balanceAdjustment += amount;
  }

  if (balanceAdjustment !== 0) {
    await applyWalletBalanceDelta(tx, walletData.id, balanceAdjustment, now);
  }

  await tx.delete(debtLoan).where(eq(debtLoan.id, debtLoanData.id));
}

export async function loadDebtLoanDetail(db: Database, userId: string, debtLoanId: string) {
  const debtLoanData = await assertOwnedDebtLoan(db, userId, debtLoanId);

  const initialRecord = await db.query.record.findFirst({
    where: eq(record.id, debtLoanData.initialRecordId),
    with: { items: true },
  });

  const resolvedRecord = debtLoanData.resolvedRecordId
    ? await db.query.record.findFirst({
        where: eq(record.id, debtLoanData.resolvedRecordId),
        with: { items: true },
      })
    : null;

  return {
    ...debtLoanData,
    initialRecord,
    resolvedRecord,
  };
}

export async function assertOwnedWalletForDebtLoan(
  db: DbExecutor,
  userId: string,
  walletId: string
) {
  return assertOwnedWallet(db, userId, walletId);
}
