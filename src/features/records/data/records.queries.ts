import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { RecordsResponseSchema, ShowRecordResponseSchema } from "./records.schema";

export const recordsQueryOptions = queryOptions({
  queryKey: ["records"],
  queryFn: async () => {
    const response = await api.get("/records");
    return RecordsResponseSchema.parse(response);
  },
});

export const useRecordsQuery = () => useQuery(recordsQueryOptions);

export const recordDetailQueryOptions = (recordId?: string) => {
  return queryOptions({
    enabled: !!recordId,
    queryKey: ["records", recordId],
    queryFn: async () => {
      const response = await api.get(`/records/${recordId}`);
      return ShowRecordResponseSchema.parse(response);
    },
  });
};

export const useRecordDetailQuery = (recordId?: string) => {
  return useQuery(recordDetailQueryOptions(recordId));
};
