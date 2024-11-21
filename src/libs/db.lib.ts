import Dexie, { type EntityTable } from "dexie";

import { type Wallet } from "@/features/wallets/data/wallets.schema";

class KagetDB extends Dexie {
  wallet!: EntityTable<Wallet, "id">;

  constructor() {
    super("KagetDB");
    this.version(1).stores({
      wallet: "id, balance, type",
    });
  }
}

export const db = new KagetDB();
