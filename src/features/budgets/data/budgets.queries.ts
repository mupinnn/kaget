import { queryOptions, useQuery, skipToken } from "@tanstack/react-query";
import { type BudgetsRequestQuery } from "./budgets.schemas";
import { getBudgetList, getBudgetDetail } from "./budgets.services";

export const budgetsQueryOptions = (req: BudgetsRequestQuery = {}) => {
  return queryOptions({
    queryKey: ["budgets", req],
    queryFn: () => getBudgetList(req),
  });
};

export const useBudgetsQuery = (req: BudgetsRequestQuery = {}) =>
  useQuery(budgetsQueryOptions(req));

export const budgetsDetailQueryOptions = (budgetId?: string) => {
  return queryOptions({
    queryKey: ["budgets", budgetId],
    queryFn: budgetId ? () => getBudgetDetail(budgetId) : skipToken,
  });
};

export const useBudgetDetailQuery = (budgetId?: string) =>
  useQuery(budgetsDetailQueryOptions(budgetId));
