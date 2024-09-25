import Dexie, { type EntityTable } from "dexie";

import { type Budget } from "@/features/budgets/data/budgets.schema";
import { type Wallet } from "@/features/wallets/data/wallets.schema";

class KagetDB extends Dexie {
  wallet!: EntityTable<Wallet, "id">;
  budget!: EntityTable<Budget, "id">;

  constructor() {
    super("KageDB");
    this.version(1).stores({
      wallet: "id",
      budget: "id, wallet_id",
    });
  }
}

export const db = new KagetDB();
