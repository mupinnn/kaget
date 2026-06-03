import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { WalletsRequestQuery } from "./wallets.schemas";
import { getWalletDetail, getWalletList } from "./wallets.services";

export const WALLETS_QUERY_KEY = "wallets";

export const walletsQueryOptions = (req: WalletsRequestQuery = {}) => {
  return queryOptions({
    queryKey: [WALLETS_QUERY_KEY, req],
    queryFn: () => getWalletList(req),
  });
};

export const useWalletsQuery = (req: WalletsRequestQuery = {}) => {
  return useQuery(walletsQueryOptions(req));
};

export const walletDetailQueryOptions = (walletId?: string) => {
  return queryOptions({
    queryKey: [WALLETS_QUERY_KEY, walletId],
    queryFn: walletId ? () => getWalletDetail(walletId) : skipToken,
  });
};

export const useWalletDetailQuery = (walletId?: string) => {
  return useQuery(walletDetailQueryOptions(walletId));
};
