import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { BudgetsResponseSchema, BudgetsRequestQuery } from "./budgets.schema";

export const budgetsQueryOptions = (req: BudgetsRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["budgets", req],
    queryFn: async () => {
      const response = await api.query(req).get("/budgets");
      return BudgetsResponseSchema.parse(response);
    },
  });
};

export const useBudgetsQuery = (req: BudgetsRequestQuery = {}) =>
  useQuery(budgetsQueryOptions(req));
