import { nanoid } from "nanoid";
import type {
  Record as LedgerRecord,
  RecordItem,
  RecordType,
} from "@/features/records/data/records.schemas";
import { db } from "@/libs/db.lib";
import {
  applyWalletBalanceDelta,
  assertWallet,
  getBalanceDelta,
  loadRecordWithItems,
} from "@/libs/ledger.lib";
import { BadRequestError, NotFoundError } from "@/utils/error.util";
import type {
  CreateDebtLoan,
  DebtLoan,
  DebtLoanDetail,
  DebtLoansRequestQuery,
  UpdateDebtLoan,
} from "./debt-loans.schemas";

const INITIAL_RECORD_TYPE = {
  DEBT: "DEBT",
  LOAN: "LOAN",
} as const satisfies Record<DebtLoan["type"], RecordType>;

const RESOLUTION_RECORD_TYPE = {
  DEBT: "DEBT_REPAYMENT",
  LOAN: "LOAN_COLLECTION",
} as const satisfies Record<DebtLoan["type"], RecordType>;

function getDefaultNote(type: DebtLoan["type"], otherParty: string): string {
  return type === "DEBT" ? `Borrowed from ${otherParty}` : `Lent to ${otherParty}`;
}

function getResolutionNote(type: DebtLoan["type"], otherParty: string): string {
  return type === "DEBT" ? `Repaid ${otherParty}` : `Collected from ${otherParty}`;
}

function assertPending(debtLoan: DebtLoan) {
  if (debtLoan.resolvedAt) {
    throw new BadRequestError("Debt/loan is already resolved");
  }
}

async function createLinkedRecord(params: {
  recordId: string;
  walletId: string;
  recordType: RecordType;
  amount: number;
  note: string;
  recordedAt: Date;
  now: Date;
}) {
  const { recordId, walletId, recordType, amount, note, recordedAt, now } = params;

  const ledgerRecord: LedgerRecord = {
    id: recordId,
    note,
    amount,
    sourceId: walletId,
    sourceType: "WALLET",
    recordType,
    recordedAt,
    createdAt: now,
    updatedAt: now,
  };
  const item: RecordItem = {
    id: nanoid(),
    recordId,
    note,
    amount,
    createdAt: now,
    updatedAt: now,
  };

  await db.records.add(ledgerRecord);
  await db.recordItems.add(item);
}

async function loadDebtLoanDetail(debtLoanId: string): Promise<DebtLoanDetail> {
  const debtLoan = await db.debtLoans.get(debtLoanId);
  if (!debtLoan) {
    throw new NotFoundError("Debt/loan not found");
  }

  const wallet = await assertWallet(debtLoan.sourceId);
  const initialRecord = await loadRecordWithItems(debtLoan.initialRecordId);
  const resolvedRecord = debtLoan.resolvedRecordId
    ? await loadRecordWithItems(debtLoan.resolvedRecordId)
    : null;

  return {
    ...debtLoan,
    wallet,
    initialRecord,
    resolvedRecord,
  };
}

export async function getDebtLoanList(query: DebtLoansRequestQuery = {}) {
  let debtLoans = await db.debtLoans.toArray();

  if (query.wallet_id) {
    debtLoans = debtLoans.filter(item => item.sourceId === query.wallet_id);
  }
  if (query.type) {
    debtLoans = debtLoans.filter(item => item.type === query.type);
  }
  if (query.status === "PENDING") {
    debtLoans = debtLoans.filter(item => item.resolvedAt === null);
  }
  if (query.status === "RESOLVED") {
    debtLoans = debtLoans.filter(item => item.resolvedAt !== null);
  }

  debtLoans.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return debtLoans.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
}

export async function getDebtLoanDetail(debtLoanId: string) {
  return loadDebtLoanDetail(debtLoanId);
}

export async function createDebtLoan(payload: CreateDebtLoan) {
  const now = new Date();
  const debtLoanId = nanoid();

  await db.transaction("rw", db.wallets, db.debtLoans, db.records, db.recordItems, async () => {
    const wallet = await assertWallet(payload.wallet_id);
    const recordNote = payload.note ?? getDefaultNote(payload.type, payload.other_party);

    if (payload.type === "LOAN" && wallet.balance < payload.amount) {
      throw new BadRequestError("Insufficient balance");
    }

    const recordId = nanoid();
    await createLinkedRecord({
      recordId,
      walletId: wallet.id,
      recordType: INITIAL_RECORD_TYPE[payload.type],
      amount: payload.amount,
      note: recordNote,
      recordedAt: payload.occurred_at,
      now,
    });

    await applyWalletBalanceDelta(
      wallet.id,
      getBalanceDelta(INITIAL_RECORD_TYPE[payload.type], payload.amount),
      now
    );

    await db.debtLoans.add({
      id: debtLoanId,
      note: payload.note ?? null,
      otherParty: payload.other_party,
      amount: payload.amount,
      type: payload.type,
      sourceId: wallet.id,
      sourceType: "WALLET",
      initialRecordId: recordId,
      resolvedAt: null,
      resolvedRecordId: null,
      occurredAt: payload.occurred_at,
      createdAt: now,
      updatedAt: now,
    });
  });

  return loadDebtLoanDetail(debtLoanId);
}

export async function updateDebtLoan(debtLoanId: string, payload: UpdateDebtLoan) {
  const now = new Date();

  await db.transaction("rw", db.wallets, db.debtLoans, db.records, db.recordItems, async () => {
    const debtLoan = await db.debtLoans.get(debtLoanId);
    if (!debtLoan) {
      throw new NotFoundError("Debt/loan not found");
    }
    assertPending(debtLoan);

    const wallet = await assertWallet(debtLoan.sourceId);
    const oldAmount = debtLoan.amount;
    const newAmount = payload.amount ?? oldAmount;
    const newOtherParty = payload.other_party ?? debtLoan.otherParty;
    const newOccurredAt = payload.occurred_at ?? debtLoan.occurredAt;
    const newNote = payload.note !== undefined ? payload.note : debtLoan.note;

    if (payload.amount !== undefined && newAmount !== oldAmount) {
      const oldDelta = getBalanceDelta(INITIAL_RECORD_TYPE[debtLoan.type], oldAmount);
      const newDelta = getBalanceDelta(INITIAL_RECORD_TYPE[debtLoan.type], newAmount);
      const netDelta = newDelta - oldDelta;

      if (debtLoan.type === "LOAN" && netDelta < 0 && wallet.balance < Math.abs(netDelta)) {
        throw new BadRequestError("Insufficient balance");
      }

      await applyWalletBalanceDelta(wallet.id, netDelta, now);
    }

    const recordNote = newNote ?? getDefaultNote(debtLoan.type, newOtherParty);

    await db.debtLoans.update(debtLoanId, {
      note: newNote,
      otherParty: newOtherParty,
      amount: newAmount,
      occurredAt: newOccurredAt,
      updatedAt: now,
    });

    await db.records.update(debtLoan.initialRecordId, {
      note: recordNote,
      amount: newAmount,
      recordedAt: newOccurredAt,
      updatedAt: now,
    });

    const items = await db.recordItems.where("recordId").equals(debtLoan.initialRecordId).toArray();
    for (const item of items) {
      await db.recordItems.update(item.id, {
        note: recordNote,
        amount: newAmount,
        updatedAt: now,
      });
    }
  });

  return loadDebtLoanDetail(debtLoanId);
}

export async function resolveDebtLoan(debtLoanId: string) {
  const now = new Date();

  await db.transaction("rw", db.wallets, db.debtLoans, db.records, db.recordItems, async () => {
    const debtLoan = await db.debtLoans.get(debtLoanId);
    if (!debtLoan) {
      throw new NotFoundError("Debt/loan not found");
    }
    assertPending(debtLoan);

    const wallet = await assertWallet(debtLoan.sourceId);
    const resolutionType = RESOLUTION_RECORD_TYPE[debtLoan.type];

    if (debtLoan.type === "DEBT" && wallet.balance < debtLoan.amount) {
      throw new BadRequestError("Insufficient balance for repayment");
    }

    const recordId = nanoid();
    await createLinkedRecord({
      recordId,
      walletId: wallet.id,
      recordType: resolutionType,
      amount: debtLoan.amount,
      note: getResolutionNote(debtLoan.type, debtLoan.otherParty),
      recordedAt: now,
      now,
    });

    await applyWalletBalanceDelta(wallet.id, getBalanceDelta(resolutionType, debtLoan.amount), now);

    await db.debtLoans.update(debtLoanId, {
      resolvedAt: now,
      resolvedRecordId: recordId,
      updatedAt: now,
    });
  });

  return loadDebtLoanDetail(debtLoanId);
}

export async function deleteDebtLoan(debtLoanId: string) {
  const debtLoan = await db.debtLoans.get(debtLoanId);
  if (!debtLoan) {
    throw new NotFoundError("Debt/loan not found");
  }

  const now = new Date();

  await db.transaction("rw", db.wallets, db.debtLoans, db.records, db.recordItems, async () => {
    const wallet = await assertWallet(debtLoan.sourceId);
    let balanceAdjustment = 0;

    if (debtLoan.resolvedRecordId) {
      await db.recordItems.where("recordId").equals(debtLoan.resolvedRecordId).delete();
      await db.records.delete(debtLoan.resolvedRecordId);
      balanceAdjustment += debtLoan.type === "DEBT" ? debtLoan.amount : -debtLoan.amount;
    }

    await db.recordItems.where("recordId").equals(debtLoan.initialRecordId).delete();
    await db.records.delete(debtLoan.initialRecordId);
    balanceAdjustment += debtLoan.type === "DEBT" ? -debtLoan.amount : debtLoan.amount;

    if (balanceAdjustment !== 0) {
      await applyWalletBalanceDelta(wallet.id, balanceAdjustment, now);
    }

    await db.debtLoans.delete(debtLoanId);
  });

  return debtLoan;
}
