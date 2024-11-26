import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { BudgetsResponseSchema } from "./budgets.schema";

export const budgetsQueryOptions = queryOptions({
  queryKey: ["budgets"],
  queryFn: async () => {
    const response = await api.get("/budgets");
    return BudgetsResponseSchema.parse(response);
  },
});

export const useBudgetsQuery = () => useQuery(budgetsQueryOptions);
