import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { successResponse } from "@/utils/service.util";
import {
  type WalletsRequestQuery,
  type Wallet,
  type CreateWallet,
  type UpdateWallet,
  UpdateWalletSchema,
  CreateWalletSchema,
  WalletsRequestQuerySchema,
  WalletSchema,
} from "./wallets.schemas";

export async function getWalletById(walletId: string) {
  const storedWalletById = await db.wallet.get(walletId);

  if (!storedWalletById) throw new Error("Wallet not found");

  return storedWalletById;
}

export async function updateWalletById(walletId: string, modifyCallback: (wallet: Wallet) => void) {
  return await db.wallet
    .where("id")
    .equals(walletId)
    .modify(wallet => {
      wallet.updated_at = new Date().toISOString();
      modifyCallback(wallet);
    });
}

export async function addWalletBalance(walletId: string, amountToAdd: number) {
  await updateWalletById(walletId, wallet => {
    wallet.balance += amountToAdd;
  });
}

export async function deductWalletBalance(walletId: string, amountToDeduct: number) {
  await updateWalletById(walletId, wallet => {
    wallet.balance -= amountToDeduct;
  });
}

export async function getWalletList(query: WalletsRequestQuery = {}) {
  const filterQueries = WalletsRequestQuerySchema.parse(query);
  const walletsCollection = db.wallet.orderBy("updated_at").reverse();
  const storedWallets = filterQueries.limit
    ? await walletsCollection.limit(filterQueries.limit).toArray()
    : await walletsCollection.toArray();

  const filteredWallets = storedWallets.filter(wallet => {
    if (filterQueries.type && wallet.type !== filterQueries.type) return false;
    return true;
  });

  return successResponse({
    data: WalletSchema.array().parse(filteredWallets),
    message: "Successfully retrieved wallets",
  });
}

export async function getWalletDetail(walletId: string) {
  const storedWallet = await getWalletById(walletId);

  return successResponse({
    data: WalletSchema.parse(storedWallet),
    message: "Successfully retrieved wallet detail",
  });
}

export async function createWallet(payload: CreateWallet) {
  const parsedPayload = CreateWalletSchema.parse(payload);
  const newWallet: Wallet = {
    id: nanoid(),
    name: parsedPayload.name,
    balance: parsedPayload.initial_balance,
    type: parsedPayload.type,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.wallet.add(newWallet);

  return successResponse({
    data: WalletSchema.parse(newWallet),
    message: "Successfully create a new wallet",
  });
}

export async function updateWalletDetail(walletId: string, payload: UpdateWallet) {
  const parsedPayload = UpdateWalletSchema.parse(payload);
  const updatedWalletRecordsCount = await updateWalletById(walletId, wallet => {
    wallet.name = parsedPayload.name;
  });

  if (updatedWalletRecordsCount === 0) {
    throw new Error("Wallet not found");
  }

  const updatedWallet = await getWalletById(walletId);

  return successResponse({
    data: WalletSchema.parse(updatedWallet),
    message: "Successfully update the wallet",
  });
}

export async function deleteWallet(walletId: string) {
  const walletToBeDeleted = await getWalletById(walletId);

  await db.wallet.delete(walletId);

  const walletRecord = await db.record.where("source_id").equals(walletId).first();

  if (walletRecord) {
    await db.record.where("source_id").equals(walletId).delete();
    await db.record_item.where("source_id").equals(walletRecord.id).delete();
  }

  return successResponse({
    data: WalletSchema.parse(walletToBeDeleted),
    message: "Successfully delete the wallet",
  });
}
