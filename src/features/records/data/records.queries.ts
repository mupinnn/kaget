import { queryOptions, useQuery, skipToken } from "@tanstack/react-query";
import { type RecordsRequestQuery } from "./records.schemas";
import { getRecordList, getRecordItemList, getRecordDetail } from "./records.services";

export const RECORDS_QUERY_KEY = "records";

export const recordsQueryOptions = (req: RecordsRequestQuery = {}) => {
  return queryOptions({
    queryKey: [RECORDS_QUERY_KEY, req],
    queryFn: () => getRecordList(req),
  });
};
export const useRecordsQuery = (req: RecordsRequestQuery = {}) =>
  useQuery(recordsQueryOptions(req));

export const recordDetailQueryOptions = (recordId?: string) => {
  return queryOptions({
    queryKey: [RECORDS_QUERY_KEY, recordId],
    queryFn: recordId ? () => getRecordDetail(recordId) : skipToken,
  });
};

export const useRecordDetailQuery = (recordId?: string) => {
  return useQuery(recordDetailQueryOptions(recordId));
};

export const recordItemsQueryOptions = (recordId?: string) => {
  return queryOptions({
    queryKey: [RECORDS_QUERY_KEY, recordId, "items"],
    queryFn: recordId ? () => getRecordItemList(recordId) : skipToken,
  });
};

export const useRecordItemsQuery = (recordId?: string) => {
  return useQuery(recordItemsQueryOptions(recordId));
};
