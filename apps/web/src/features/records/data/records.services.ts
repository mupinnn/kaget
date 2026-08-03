import { nanoid } from "nanoid";
import { match, P } from "ts-pattern";
import { getBudgetList } from "@/features/budgets/data/budgets.services";
import { getWalletList } from "@/features/wallets/data/wallets.services";
import { db } from "@/libs/db.lib";
import {
  applyBudgetBalanceDelta,
  applyWalletBalanceDelta,
  archiveBudgetIfZero,
  assertBudget,
  assertBudgetActive,
  assertWallet,
  getBalanceDelta,
  loadRecordWithItems,
  sumItemAmounts,
  validateGoalSpendable,
} from "@/libs/ledger.lib";
import { cn } from "@/libs/utils.lib";
import { parseAmount } from "@/utils/amount.util";
import { formatCurrency } from "@/utils/common.util";
import { BadRequestError, NotFoundError } from "@/utils/error.util";
import type {
  CreateRecordForm,
  Record as LedgerRecord,
  OwnedRecord,
  RecordItem,
  RecordListItem,
  RecordsRequestQuery,
  RecordWithItems,
} from "./records.schemas";

function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

async function resolveSourceNames(records: RecordWithItems[]): Promise<RecordListItem[]> {
  const [wallets, budgets] = await Promise.all([getWalletList(), getBudgetList()]);
  const walletMap = new Map(wallets.map(wallet => [wallet.id, wallet.name]));
  const budgetMap = new Map(budgets.map(budget => [budget.id, budget.name]));

  return records.map(record => ({
    ...record,
    sourceName:
      record.sourceType === "WALLET"
        ? (walletMap.get(record.sourceId) ?? "Wallet")
        : (budgetMap.get(record.sourceId) ?? "Budget"),
  }));
}

export function getRecordAmountValueAndClasses(record: {
  recordType: string;
  amount: string | number;
}) {
  const amount = parseAmount(record.amount);
  const isAddition = match(record.recordType)
    .with(P.union("INCOME", "LOAN_COLLECTION", "DEBT"), () => true)
    .with(P.union("EXPENSE", "DEBT_REPAYMENT", "LOAN"), () => false)
    .otherwise(() => false);
  const className = cn(isAddition ? "text-success" : "text-destructive");
  const operator = isAddition ? "+" : "-";
  const value = `${operator} ${formatCurrency(amount)}`;

  return { className, value, operator, isAddition };
}

async function withItems(records: LedgerRecord[]): Promise<RecordWithItems[]> {
  return Promise.all(
    records.map(async record => {
      const items = await db.recordItems.where("recordId").equals(record.id).toArray();
      return { ...record, items };
    })
  );
}

export async function getRecordList(query: RecordsRequestQuery = {}) {
  let records = await db.records.toArray();

  if (query.source_id) {
    records = records.filter(record => record.sourceId === query.source_id);
  }

  if (query.source_type) {
    records = records.filter(record => record.sourceType === query.source_type);
  } else if (!query.source_id) {
    // Default list mirrors API wallet-scoped records list
    records = records.filter(record => record.sourceType === "WALLET");
  }

  if (query.start) {
    const start = query.start;
    records = records.filter(record => record.recordedAt >= start);
  }

  if (query.end) {
    const end = endOfDay(query.end);
    records = records.filter(record => record.recordedAt <= end);
  }

  records.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  records = records.slice(0, 100);

  return resolveSourceNames(await withItems(records));
}

export async function getRecordDetail(recordId: string): Promise<OwnedRecord> {
  const record = await loadRecordWithItems(recordId);

  if (record.sourceType === "WALLET") {
    const wallet = await assertWallet(record.sourceId);
    return { ...record, sourceType: "WALLET", wallet };
  }

  const budget = await assertBudget(record.sourceId);
  return { ...record, sourceType: "BUDGET", budget };
}

export async function getRecordItemList(recordId: string) {
  const record = await getRecordDetail(recordId);
  return record.items;
}

function toCreateRecordPayload(payload: CreateRecordForm, sourceType: "WALLET" | "BUDGET") {
  const items =
    payload.items.length > 0
      ? payload.items
      : [{ amount: payload.amount ?? 0, note: payload.note }];

  return {
    source_id: payload.source.id,
    source_type: sourceType,
    record_type: payload.record_type,
    recorded_at: new Date(payload.dor),
    note: payload.note,
    items,
  };
}

export async function createRecord(payload: CreateRecordForm) {
  const resolvedSourceType = "walletId" in payload.source ? "BUDGET" : "WALLET";
  const body = toCreateRecordPayload(payload, resolvedSourceType);
  const recordId = nanoid();
  const now = new Date();
  const totalAmount = sumItemAmounts(body.items);

  await db.transaction("rw", db.wallets, db.budgets, db.records, db.recordItems, async () => {
    if (body.source_type === "WALLET") {
      await assertWallet(body.source_id);

      const ledgerRecord: LedgerRecord = {
        id: recordId,
        note: body.note ?? null,
        amount: totalAmount,
        sourceId: body.source_id,
        sourceType: "WALLET",
        recordType: body.record_type,
        recordedAt: body.recorded_at,
        createdAt: now,
        updatedAt: now,
      };

      await db.records.add(ledgerRecord);
      for (const item of body.items) {
        const recordItem: RecordItem = {
          id: nanoid(),
          recordId,
          note: item.note ?? null,
          amount: item.amount,
          createdAt: now,
          updatedAt: now,
        };
        await db.recordItems.add(recordItem);
      }

      await applyWalletBalanceDelta(
        body.source_id,
        getBalanceDelta(body.record_type, totalAmount),
        now
      );
      return;
    }

    const budget = await assertBudget(body.source_id);
    assertBudgetActive(budget, "spend");
    validateGoalSpendable(budget);

    if (totalAmount > budget.balance) {
      throw new BadRequestError("Insufficient budget balance");
    }

    const ledgerRecord: LedgerRecord = {
      id: recordId,
      note: body.note ?? null,
      amount: totalAmount,
      sourceId: body.source_id,
      sourceType: "BUDGET",
      recordType: "EXPENSE",
      recordedAt: body.recorded_at,
      createdAt: now,
      updatedAt: now,
    };

    await db.records.add(ledgerRecord);
    for (const item of body.items) {
      const recordItem: RecordItem = {
        id: nanoid(),
        recordId,
        note: item.note ?? null,
        amount: item.amount,
        createdAt: now,
        updatedAt: now,
      };
      await db.recordItems.add(recordItem);
    }

    await applyBudgetBalanceDelta(body.source_id, -totalAmount, now);
    await archiveBudgetIfZero(body.source_id, now);
  });

  return getRecordDetail(recordId);
}

export async function deleteRecord(recordId: string) {
  const current = await getRecordDetail(recordId);

  if (current.sourceType === "BUDGET") {
    throw new NotFoundError("Record does not exist");
  }

  const now = new Date();
  const reversalDelta = -getBalanceDelta(current.recordType, current.amount);

  await db.transaction("rw", db.wallets, db.records, db.recordItems, async () => {
    await db.recordItems.where("recordId").equals(recordId).delete();
    await db.records.delete(recordId);
    await applyWalletBalanceDelta(current.sourceId, reversalDelta, now);
  });

  return current;
}

export function getRecordSourceName(record: OwnedRecord | RecordListItem) {
  if ("sourceName" in record) {
    return record.sourceName;
  }

  if ("wallet" in record && record.wallet) {
    return record.wallet.name;
  }

  if ("budget" in record && record.budget) {
    return record.budget.name;
  }

  return record.sourceType;
}
