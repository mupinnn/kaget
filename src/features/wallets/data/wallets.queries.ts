import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/libs/api.lib";
import { ShowWalletResponseSchema, WalletsResponseSchema } from "./wallets.schema";

export const walletsQueryOptions = queryOptions({
  queryKey: ["wallets"],
  queryFn: async () => {
    const response = await api.get("/wallets");
    return WalletsResponseSchema.parse(response);
  },
});

export const useWalletsQuery = () => useQuery(walletsQueryOptions);

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
