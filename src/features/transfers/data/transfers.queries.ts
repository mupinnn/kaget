import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import {
  ShowTransferResponseSchema,
  TransfersRequestQuery,
  TransfersResponseSchema,
} from "./transfers.schema";

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

export const transferDetailQueryOptions = (transferId: string) => {
  return queryOptions({
    queryKey: ["transfers", transferId],
    queryFn: async () => {
      const response = await api.get(`/transfers/${transferId}`);
      return ShowTransferResponseSchema.parse(response);
    },
    enabled: !!transferId,
  });
};

export const useTransferDetailQuery = (transferId: string) => {
  return useQuery(transferDetailQueryOptions(transferId));
};
