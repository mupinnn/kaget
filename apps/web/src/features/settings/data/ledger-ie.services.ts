import type { Budget } from "@/features/budgets/data/budgets.schemas";
import type { DebtLoan } from "@/features/debt-loans/data/debt-loans.schemas";
import type { Record as LedgerRecord, RecordItem } from "@/features/records/data/records.schemas";
import type { Settings } from "@/features/settings/data/settings.schemas";
import type { Transfer } from "@/features/transfers/data/transfers.schemas";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { db, LOCAL_SETTINGS_ID } from "@/libs/db.lib";
import { NotFoundError } from "@/utils/error.util";
import { clearDriveSyncCursor } from "./drive-sync.meta";
import {
  buildLedgerDocument,
  parseLedgerDocumentJson,
  serializeLedgerDocument,
} from "./ledger-document";
import type { LedgerDocument, LedgerDocumentPayload } from "./ledger-document.schemas";
import { setCachedCurrencyCode } from "./settings.cache";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function fromIso(value: string): Date {
  return new Date(value);
}

async function loadLedgerDocumentPayload(): Promise<LedgerDocumentPayload> {
  const settings = await db.settings.get(LOCAL_SETTINGS_ID);
  if (!settings) {
    throw new NotFoundError("Settings not found");
  }

  const [wallets, budgets, records, recordItems, transfers, debtLoans] = await Promise.all([
    db.wallets.toArray(),
    db.budgets.toArray(),
    db.records.toArray(),
    db.recordItems.toArray(),
    db.transfers.toArray(),
    db.debtLoans.toArray(),
  ]);

  const itemsByRecordId = new Map<string, RecordItem[]>();
  for (const item of recordItems) {
    const list = itemsByRecordId.get(item.recordId) ?? [];
    list.push(item);
    itemsByRecordId.set(item.recordId, list);
  }

  return {
    settings: { currency_code: settings.currencyCode },
    wallets: wallets.map(wallet => ({
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      created_at: toIso(wallet.createdAt),
      updated_at: toIso(wallet.updatedAt),
    })),
    budgets: budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      wallet_id: budget.walletId,
      balance: budget.balance,
      total_balance: budget.totalBalance,
      budget_type: budget.budgetType,
      archived_at: budget.archivedAt ? toIso(budget.archivedAt) : null,
      created_at: toIso(budget.createdAt),
      updated_at: toIso(budget.updatedAt),
    })),
    records: records.map(record => ({
      id: record.id,
      note: record.note,
      amount: record.amount,
      source_id: record.sourceId,
      source_type: record.sourceType,
      record_type: record.recordType,
      recorded_at: toIso(record.recordedAt),
      created_at: toIso(record.createdAt),
      updated_at: toIso(record.updatedAt),
      items: (itemsByRecordId.get(record.id) ?? []).map(item => ({
        id: item.id,
        note: item.note,
        amount: item.amount,
        created_at: toIso(item.createdAt),
        updated_at: toIso(item.updatedAt),
      })),
    })),
    transfers: transfers.map(transfer => ({
      id: transfer.id,
      note: transfer.note,
      amount: transfer.amount,
      fee: transfer.fee,
      source_id: transfer.sourceId,
      source_type: transfer.sourceType,
      source_name: transfer.sourceName,
      destination_id: transfer.destinationId,
      destination_type: transfer.destinationType,
      destination_name: transfer.destinationName,
      type: transfer.type,
      ref_id: transfer.refId,
      transferred_at: toIso(transfer.transferredAt),
      created_at: toIso(transfer.createdAt),
      updated_at: toIso(transfer.updatedAt),
    })),
    debt_loans: debtLoans.map(debtLoan => ({
      id: debtLoan.id,
      note: debtLoan.note,
      other_party: debtLoan.otherParty,
      amount: debtLoan.amount,
      type: debtLoan.type,
      source_id: debtLoan.sourceId,
      source_type: debtLoan.sourceType,
      initial_record_id: debtLoan.initialRecordId,
      resolved_at: debtLoan.resolvedAt ? toIso(debtLoan.resolvedAt) : null,
      resolved_record_id: debtLoan.resolvedRecordId,
      occurred_at: toIso(debtLoan.occurredAt),
      created_at: toIso(debtLoan.createdAt),
      updated_at: toIso(debtLoan.updatedAt),
    })),
  };
}

function mapDocumentToTables(document: LedgerDocument) {
  const now = new Date();
  const settings: Settings = {
    id: LOCAL_SETTINGS_ID,
    currencyCode: document.settings.currency_code,
    createdAt: now,
    updatedAt: now,
  };

  const wallets: Wallet[] = document.wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    balance: wallet.balance,
    createdAt: fromIso(wallet.created_at),
    updatedAt: fromIso(wallet.updated_at),
  }));

  const budgets: Budget[] = document.budgets.map(budget => ({
    id: budget.id,
    name: budget.name,
    walletId: budget.wallet_id,
    balance: budget.balance,
    totalBalance: budget.total_balance,
    budgetType: budget.budget_type,
    archivedAt: budget.archived_at ? fromIso(budget.archived_at) : null,
    createdAt: fromIso(budget.created_at),
    updatedAt: fromIso(budget.updated_at),
  }));

  const records: LedgerRecord[] = [];
  const recordItems: RecordItem[] = [];
  for (const record of document.records) {
    records.push({
      id: record.id,
      note: record.note,
      amount: record.amount,
      sourceId: record.source_id,
      sourceType: record.source_type,
      recordType: record.record_type,
      recordedAt: fromIso(record.recorded_at),
      createdAt: fromIso(record.created_at),
      updatedAt: fromIso(record.updated_at),
    });
    for (const item of record.items) {
      recordItems.push({
        id: item.id,
        recordId: record.id,
        note: item.note,
        amount: item.amount,
        createdAt: fromIso(item.created_at),
        updatedAt: fromIso(item.updated_at),
      });
    }
  }

  const transfers: Transfer[] = document.transfers.map(transfer => ({
    id: transfer.id,
    note: transfer.note,
    amount: transfer.amount,
    fee: transfer.fee,
    sourceId: transfer.source_id,
    sourceType: transfer.source_type,
    sourceName: transfer.source_name,
    destinationId: transfer.destination_id,
    destinationType: transfer.destination_type,
    destinationName: transfer.destination_name,
    type: transfer.type,
    refId: transfer.ref_id,
    transferredAt: fromIso(transfer.transferred_at),
    createdAt: fromIso(transfer.created_at),
    updatedAt: fromIso(transfer.updated_at),
  }));

  const debtLoans: DebtLoan[] = document.debt_loans.map(debtLoan => ({
    id: debtLoan.id,
    note: debtLoan.note,
    otherParty: debtLoan.other_party,
    amount: debtLoan.amount,
    type: debtLoan.type,
    sourceId: debtLoan.source_id,
    sourceType: debtLoan.source_type,
    initialRecordId: debtLoan.initial_record_id,
    resolvedAt: debtLoan.resolved_at ? fromIso(debtLoan.resolved_at) : null,
    resolvedRecordId: debtLoan.resolved_record_id,
    occurredAt: fromIso(debtLoan.occurred_at),
    createdAt: fromIso(debtLoan.created_at),
    updatedAt: fromIso(debtLoan.updated_at),
  }));

  return { settings, wallets, budgets, records, recordItems, transfers, debtLoans };
}

export async function replaceLocalLedgerFromDocument(document: LedgerDocument) {
  const tables = mapDocumentToTables(document);

  await db.transaction(
    "rw",
    db.settings,
    db.wallets,
    db.budgets,
    db.records,
    db.recordItems,
    db.transfers,
    db.debtLoans,
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.wallets.clear(),
        db.budgets.clear(),
        db.records.clear(),
        db.recordItems.clear(),
        db.transfers.clear(),
        db.debtLoans.clear(),
      ]);

      await db.settings.add(tables.settings);
      if (tables.wallets.length > 0) await db.wallets.bulkAdd(tables.wallets);
      if (tables.budgets.length > 0) await db.budgets.bulkAdd(tables.budgets);
      if (tables.records.length > 0) await db.records.bulkAdd(tables.records);
      if (tables.recordItems.length > 0) await db.recordItems.bulkAdd(tables.recordItems);
      if (tables.transfers.length > 0) await db.transfers.bulkAdd(tables.transfers);
      if (tables.debtLoans.length > 0) await db.debtLoans.bulkAdd(tables.debtLoans);
    }
  );

  setCachedCurrencyCode(document.settings.currency_code);
}

export async function buildLocalLedgerDocument(options: { revisedAt?: string } = {}) {
  const payload = await loadLedgerDocumentPayload();
  return buildLedgerDocument(payload, options);
}

export async function exportLedgerDocumentJson(options: { pretty?: boolean } = {}) {
  const document = await buildLocalLedgerDocument();
  return serializeLedgerDocument(document, options);
}

export async function importLedgerDocumentJson(json: string) {
  const document = await parseLedgerDocumentJson(json);
  await replaceLocalLedgerFromDocument(document);
  await clearDriveSyncCursor();
  return document;
}

export async function exportData() {
  return exportLedgerDocumentJson({ pretty: true });
}

export async function importData(file: Blob) {
  const json = await file.text();
  return importLedgerDocumentJson(json);
}
