import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/libs/api.lib";
import { WalletSchema } from "./wallets.schema";

export const walletsQueryOptions = queryOptions({
  queryKey: ["wallets"],
  queryFn: async () => {
    const response = await api.get("/wallets");
    return WalletSchema.parse(response);
  },
});

export const useWallets = () => useQuery(walletsQueryOptions);
