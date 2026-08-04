import Dexie, { type EntityTable } from "dexie";
import type { Budget } from "@/features/budgets/data/budgets.schemas";
import type { DebtLoan } from "@/features/debt-loans/data/debt-loans.schemas";
import type { Record, RecordItem } from "@/features/records/data/records.schemas";
import type { Settings } from "@/features/settings/data/settings.schemas";
import type { Transfer } from "@/features/transfers/data/transfers.schemas";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";

export const LOCAL_SETTINGS_ID = "local";

class KagetDB extends Dexie {
  wallets!: EntityTable<Wallet, "id">;
  budgets!: EntityTable<Budget, "id">;
  records!: EntityTable<Record, "id">;
  recordItems!: EntityTable<RecordItem, "id">;
  transfers!: EntityTable<Transfer, "id">;
  debtLoans!: EntityTable<DebtLoan, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("KagetDB");
    this.version(1).stores({
      wallets: "id, type, createdAt, updatedAt",
      budgets: "id, walletId, budgetType, archivedAt, createdAt, updatedAt",
      records: "id, sourceId, sourceType, recordType, recordedAt, createdAt, updatedAt",
      recordItems: "id, recordId, createdAt, updatedAt",
      transfers:
        "id, refId, sourceId, sourceType, destinationId, destinationType, type, transferredAt, createdAt, updatedAt",
      debtLoans: "id, sourceId, type, resolvedAt, occurredAt, createdAt, updatedAt",
      settings: "id, currencyCode",
    });
  }
}

export const db = new KagetDB();
