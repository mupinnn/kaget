import Dexie, { type EntityTable } from "dexie";

import type { Wallet } from "@/features/wallets/data/wallets.schema";
import type { Budget, BudgetDetail, WalletBudget } from "@/features/budgets/data/budgets.schema";
import type { Record, RecordDetail } from "@/features/records/data/records.schema";

class KagetDB extends Dexie {
  wallet!: EntityTable<Wallet, "id">;
  budget!: EntityTable<Budget, "id">;
  budget_detail!: EntityTable<BudgetDetail, "id">;
  wallet_budget!: EntityTable<WalletBudget, "id">;
  record!: EntityTable<Record, "id">;
  record_detail!: EntityTable<RecordDetail, "id">;

  constructor() {
    super("KagetDB");
    this.version(1).stores({
      wallet: "id, balance, type",
      budget: "id, allocated_digital_balance, allocated_cash_balance",
      budget_detail: "id, allocated_digital_balance, allocated_cash_balance, budget_id",
      wallet_budget: "id, wallet_id, budget_id",
      record: "id, source_id, source_type, record_type",
      record_detail: "id, record_id",
    });
  }
}

export const db = new KagetDB();
