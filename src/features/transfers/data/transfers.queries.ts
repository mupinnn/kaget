import { queryOptions } from "@tanstack/react-query";
import { TransfersRequestQuery } from "./transfers.schema";

export const transfersQueryOptions = (req: TransfersRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["transfers", req],
  });
};
