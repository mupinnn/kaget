import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import {
  BudgetsResponseSchema,
  BudgetsRequestQuery,
  ShowBudgetResponseSchema,
} from "./budgets.schema";

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

export const budgetsDetailQueryOptions = (budgetId?: string) => {
  return queryOptions({
    queryKey: ["budgets", budgetId],
    enabled: !!budgetId,
    queryFn: async () => {
      const response = await api.get(`/budgets/${budgetId}`);
      return ShowBudgetResponseSchema.parse(response);
    },
  });
};

export const useBudgetDetailQuery = (budgetId?: string) =>
  useQuery(budgetsDetailQueryOptions(budgetId));
