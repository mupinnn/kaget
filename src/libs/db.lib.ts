import Dexie, { type EntityTable } from "dexie";

import type { Wallet } from "@/features/wallets/data/wallets.schema";
import type { Budget, BudgetItem, WalletBudget } from "@/features/budgets/data/budgets.schema";
import type { Record, RecordItem } from "@/features/records/data/records.schema";
import type { Transfer } from "@/features/transfers/data/transfers.schema";

class KagetDB extends Dexie {
  wallet!: EntityTable<Wallet, "id">;
  budget!: EntityTable<Budget, "id">;
  budget_item!: EntityTable<BudgetItem, "id">;
  wallet_budget!: EntityTable<WalletBudget, "id">;
  record!: EntityTable<Record, "id">;
  record_item!: EntityTable<RecordItem, "id">;
  transfer!: EntityTable<Transfer, "id">;

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
  }
}

export const db = new KagetDB();
