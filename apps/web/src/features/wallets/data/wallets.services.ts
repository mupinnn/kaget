import { nanoid } from "nanoid";
import type { Record as LedgerRecord, RecordItem } from "@/features/records/data/records.schemas";
import { db } from "@/libs/db.lib";
import {
  applyWalletBalanceDelta,
  assertWallet,
  deleteRecordItemsForRecordIds,
  getBalanceDelta,
} from "@/libs/ledger.lib";
import type { CreateWallet, UpdateWallet, Wallet, WalletsRequestQuery } from "./wallets.schemas";

export async function getWalletList(query: WalletsRequestQuery = {}): Promise<Wallet[]> {
  let wallets = await db.wallets.orderBy("createdAt").reverse().toArray();

  if (query.type) {
    wallets = wallets.filter(wallet => wallet.type === query.type);
  }

  if (query.limit) {
    wallets = wallets.slice(0, query.limit);
  }

  return wallets;
}

export async function getWalletDetail(walletId: string) {
  const wallet = await assertWallet(walletId);
  const walletRecords = (await db.records.where("sourceId").equals(walletId).toArray())
    .filter(record => record.sourceType === "WALLET")
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
    .slice(0, 10);

  const withItems = await Promise.all(
    walletRecords.map(async record => {
      const items = await db.recordItems.where("recordId").equals(record.id).toArray();
      return { ...record, items };
    })
  );

  return { ...wallet, records: withItems };
}

export async function createWallet(payload: CreateWallet): Promise<Wallet> {
  const walletId = nanoid();
  const now = new Date();
  const initialBalance = payload.initial_balance ?? 0;

  await db.transaction("rw", db.wallets, db.records, db.recordItems, async () => {
    await db.wallets.add({
      id: walletId,
      name: payload.name,
      type: payload.type,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    });

    if (initialBalance > 0) {
      const recordId = nanoid();
      const openingRecord: LedgerRecord = {
        id: recordId,
        note: "Opening Balance",
        amount: initialBalance,
        sourceId: walletId,
        sourceType: "WALLET",
        recordType: "INCOME",
        recordedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      const openingItem: RecordItem = {
        id: nanoid(),
        recordId,
        note: "Opening Balance",
        amount: initialBalance,
        createdAt: now,
        updatedAt: now,
      };

      await db.records.add(openingRecord);
      await db.recordItems.add(openingItem);
      await applyWalletBalanceDelta(walletId, getBalanceDelta("INCOME", initialBalance), now);
    }
  });

  return assertWallet(walletId);
}

export async function updateWalletDetail(walletId: string, payload: UpdateWallet): Promise<Wallet> {
  await assertWallet(walletId);
  const now = new Date();
  await db.wallets.update(walletId, { name: payload.name, updatedAt: now });
  return assertWallet(walletId);
}

export async function deleteWallet(walletId: string): Promise<Wallet> {
  const wallet = await assertWallet(walletId);

  await db.transaction(
    "rw",
    db.wallets,
    db.budgets,
    db.records,
    db.recordItems,
    db.transfers,
    db.debtLoans,
    async () => {
      const budgets = await db.budgets.where("walletId").equals(walletId).toArray();
      const budgetIds = budgets.map(budget => budget.id);

      const walletRecords = (await db.records.where("sourceId").equals(walletId).toArray()).filter(
        record => record.sourceType === "WALLET"
      );
      const budgetRecords =
        budgetIds.length > 0
          ? (await db.records.where("sourceId").anyOf(budgetIds).toArray()).filter(
              record => record.sourceType === "BUDGET"
            )
          : [];

      const recordIds = [...walletRecords, ...budgetRecords].map(record => record.id);
      await deleteRecordItemsForRecordIds(recordIds);
      if (recordIds.length > 0) {
        await db.records.bulkDelete(recordIds);
      }

      const walletTransfers = (
        await db.transfers.where("sourceId").equals(walletId).toArray()
      ).filter(transfer => transfer.sourceType === "WALLET");
      const budgetTransfers =
        budgetIds.length > 0
          ? (await db.transfers.where("sourceId").anyOf(budgetIds).toArray()).filter(
              transfer => transfer.sourceType === "BUDGET"
            )
          : [];
      const transferIds = [...walletTransfers, ...budgetTransfers].map(transfer => transfer.id);
      if (transferIds.length > 0) {
        await db.transfers.bulkDelete(transferIds);
      }

      await db.debtLoans.where("sourceId").equals(walletId).delete();

      if (budgetIds.length > 0) {
        await db.budgets.bulkDelete(budgetIds);
      }

      await db.wallets.delete(walletId);
    }
  );

  return wallet;
}
