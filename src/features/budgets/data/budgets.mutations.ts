import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type CreateBudget, type UpdateBudgetBalance } from "./budgets.schemas";
import { RECORDS_QUERY_KEY } from "@/features/records/data/records.queries";
import { TRANSFERS_QUERY_KEY } from "@/features/transfers/data/transfers.queries";
import {
  activateBudget,
  createBudget,
  deleteBudget,
  updateBudgetBalanceDetail,
} from "./budgets.services";
import { BUDGETS_QUERY_KEY } from "./budgets.queries";

export const useCreateBudgetMutation = () => {
  return useMutation({
    async mutationFn(data: CreateBudget) {
      return await createBudget(data);
    },
  });
};

export const useDeleteBudgetMutation = () => {
  return useMutation({
    async mutationFn(budgetId: string) {
      return await deleteBudget(budgetId);
    },
  });
};

export const useUpdateBudgetBalanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn({ budgetId, data }: { budgetId: string; data: UpdateBudgetBalance }) {
      return await updateBudgetBalanceDetail(budgetId, data);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSFERS_QUERY_KEY] });
    },
  });
};

export const useActivateBudgetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(budgetId: string) {
      return await activateBudget(budgetId);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSFERS_QUERY_KEY] });
    },
  });
};
