import { queryOptions, useQuery, skipToken } from "@tanstack/react-query";
import { type RecordsRequestQuery } from "./records.schemas";
import { getRecordList, getRecordItemList, getRecordDetail } from "./records.services";

export const recordsQueryOptions = (req: RecordsRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["records", req],
    queryFn: () => getRecordList(req),
  });
};
export const useRecordsQuery = (req: RecordsRequestQuery = {}) =>
  useQuery(recordsQueryOptions(req));

export const recordDetailQueryOptions = (recordId?: string) => {
  return queryOptions({
    queryKey: ["records", recordId],
    queryFn: recordId ? () => getRecordDetail(recordId) : skipToken,
  });
};

export const useRecordDetailQuery = (recordId?: string) => {
  return useQuery(recordDetailQueryOptions(recordId));
};

export const recordItemsQueryOptions = (recordId?: string) => {
  return queryOptions({
    queryKey: ["records", recordId, "items"],
    queryFn: recordId ? () => getRecordItemList(recordId) : skipToken,
  });
};

export const useRecordItemsQuery = (recordId?: string) => {
  return useQuery(recordItemsQueryOptions(recordId));
};
