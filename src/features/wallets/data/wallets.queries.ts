import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/libs/api.lib";
import {
  ShowWalletResponseSchema,
  WalletsRequestQuery,
  WalletsResponseSchema,
} from "./wallets.schema";

export const walletsQueryOptions = (req: WalletsRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["wallets", req],
    queryFn: async () => {
      const response = await api.query(req).get("/wallets");
      return WalletsResponseSchema.parse(response);
    },
  });
};

export const useWalletsQuery = (req: WalletsRequestQuery = {}) => {
  return useQuery(walletsQueryOptions(req));
};

export const walletDetailQueryOptions = (walletId?: string) => {
  return queryOptions({
    enabled: !!walletId,
    queryKey: ["wallets", walletId],
    queryFn: async () => {
      const response = await api.get(`/wallets/${walletId}`);
      return ShowWalletResponseSchema.parse(response);
    },
  });
};

export const useWalletDetailQuery = (walletId?: string) => {
  return useQuery(walletDetailQueryOptions(walletId));
};
