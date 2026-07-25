import { api } from "@/libs/api.lib";
import { unwrap } from "@/utils/api.util";
import type { CreateWallet, UpdateWallet, WalletsRequestQuery } from "./wallets.schemas";

export async function getWalletList(query: WalletsRequestQuery = {}) {
  const wallets = await unwrap(api.api.wallets.$get());

  let filtered = wallets;

  if (query.type) {
    filtered = filtered.filter(wallet => wallet.type === query.type);
  }

  if (query.limit) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}

export const getWalletDetail = (walletId: string) =>
  unwrap(api.api.wallets[":id"].$get({ param: { id: walletId } }));

export const createWallet = (payload: CreateWallet) =>
  unwrap(api.api.wallets.$post({ json: payload }));

export const updateWalletDetail = (walletId: string, payload: UpdateWallet) =>
  unwrap(api.api.wallets[":id"].$patch({ param: { id: walletId }, json: payload }));

export const deleteWallet = (walletId: string) =>
  unwrap(api.api.wallets[":id"].$delete({ param: { id: walletId } }));
