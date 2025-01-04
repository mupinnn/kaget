import { queryOptions, useQuery, skipToken } from "@tanstack/react-query";

import { getWalletList, getWalletDetail } from "./wallets.services";
import { WalletsRequestQuery } from "./wallets.schemas";

export const walletsQueryOptions = (req: WalletsRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["wallets", req],
    queryFn: () => getWalletList(req),
  });
};

export const useWalletsQuery = (req: WalletsRequestQuery = {}) => {
  return useQuery(walletsQueryOptions(req));
};

export const walletDetailQueryOptions = (walletId?: string) => {
  return queryOptions({
    queryKey: ["wallets", walletId],
    queryFn: walletId ? () => getWalletDetail(walletId) : skipToken,
  });
};

export const useWalletDetailQuery = (walletId?: string) => {
  return useQuery(walletDetailQueryOptions(walletId));
};
