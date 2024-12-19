import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { TransfersRequestQuery, TransfersResponseSchema } from "./transfers.schema";

export const transfersQueryOptions = (req: TransfersRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["transfers", req],
    queryFn: async () => {
      const response = await api.query(req).get("/transfers");
      return TransfersResponseSchema.parse(response);
    },
  });
};

export const useTransfersQuery = (req: TransfersRequestQuery = {}) => {
  return useQuery(transfersQueryOptions(req));
};
