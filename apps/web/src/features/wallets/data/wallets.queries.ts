import { queryOptions, useQuery, skipToken } from "@tanstack/react-query";
import { getWalletList, getWalletDetail } from "./wallets.services";
import { WalletsRequestQuery } from "./wallets.schemas";

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
