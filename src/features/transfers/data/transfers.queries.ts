import { useQuery, queryOptions } from "@tanstack/react-query";
import { type TransfersRequestQuery } from "./transfers.schemas";
import { getTransferList } from "./transfers.services";

export const transfersQueryOptions = (req: TransfersRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["transfers", req],
    queryFn: () => getTransferList(req),
  });
};

export const useTransfersQuery = (req: TransfersRequestQuery = {}) => {
  return useQuery(transfersQueryOptions(req));
};
