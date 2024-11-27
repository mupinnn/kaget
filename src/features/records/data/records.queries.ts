import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { RecordsResponseSchema } from "./records.schema";

export const recordsQueryOptions = queryOptions({
  queryKey: ["records"],
  queryFn: async () => {
    const response = await api.get("/records");
    return RecordsResponseSchema.parse(response);
  },
});

export const useRecordsQuery = () => useQuery(recordsQueryOptions);
