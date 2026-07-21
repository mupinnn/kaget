import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RECORDS_QUERY_KEY } from "@/features/records/data/records.queries";
import { TRANSFERS_QUERY_KEY } from "@/features/transfers/data/transfers.queries";
import { WALLETS_QUERY_KEY } from "@/features/wallets/data/wallets.queries";
import { BUDGETS_QUERY_KEY } from "./budgets.queries";
import type { CreateBudget, UpdateBudgetBalance } from "./budgets.schemas";
import { activateBudget, createBudget, updateBudgetBalanceDetail } from "./budgets.services";

export const useCreateBudgetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBudget) => createBudget(data),
    meta: { successMessage: "Successfully created budget" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSFERS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
};

export const useUpdateBudgetBalanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, data }: { budgetId: string; data: UpdateBudgetBalance }) =>
      updateBudgetBalanceDetail(budgetId, data),
    meta: { successMessage: "Successfully updated budget balance" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSFERS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};

export const useActivateBudgetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: string) => activateBudget(budgetId),
    meta: { successMessage: "Successfully reactivated budget" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSFERS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};
