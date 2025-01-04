import Dexie, { type EntityTable } from "dexie";

import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import type { Budget, BudgetItem } from "@/features/budgets/data/budgets.schema";
import type { Record, RecordItem } from "@/features/records/data/records.schema";
import type { Transfer } from "@/features/transfers/data/transfers.schema";
import type { Settings } from "@/features/settings/data/settings.schema";

class KagetDB extends Dexie {
  wallet!: EntityTable<Wallet, "id">;
  budget!: EntityTable<Budget, "id">;
  budget_item!: EntityTable<BudgetItem, "id">;
  record!: EntityTable<Record, "id">;
  record_item!: EntityTable<RecordItem, "id">;
  transfer!: EntityTable<Transfer, "id">;
  settings!: EntityTable<Settings>;

  constructor() {
    super("KagetDB");
    this.version(1).stores({
      wallet: "id, balance, type, created_at, updated_at",
      budget: "id, allocated_digital_balance, allocated_cash_balance",
      budget_item: "id, allocated_digital_balance, allocated_cash_balance, budget_id",
      wallet_budget: "id, wallet_id, budget_id",
      record: "id, source_id, source_type, record_type, recorded_at",
      record_item: "id, record_id",
      transfer: "id, source_id, source_type, destination_id, destination_type, created_at",
    });

    this.version(2).stores({
      wallet_budget: null,
      budget: "id, balance, total_balance, wallet_id, created_at, updated_at, archived_at",
      budget_item: "id, balance, wallet_id, budget_id, created_at, updated_at",
      transfer:
        "id, ref_id, source_id, source_type, destination_id, destination_type, created_at, type",
    });

    this.version(3).stores({
      settings: "++, currency",
    });
  }
}

export const db = new KagetDB();
