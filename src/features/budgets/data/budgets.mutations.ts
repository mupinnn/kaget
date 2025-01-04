import { useMutation } from "@tanstack/react-query";
import { type CreateBudget, type UpdateBudgetBalance } from "./budgets.schemas";
import {
  activateBudget,
  createBudget,
  deleteBudget,
  updateBudgetBalanceDetail,
} from "./budgets.services";

export const useCreateBudgetMutation = () => {
  return useMutation({
    async mutationFn(data: CreateBudget) {
      return await createBudget(data);
    },
  });
};

export const useDeletBudgetMutation = () => {
  return useMutation({
    async mutationFn(budgetId: string) {
      return await deleteBudget(budgetId);
    },
  });
};

export const useUpdateBudgetBalanceMutation = () => {
  return useMutation({
    async mutationFn({ budgetId, data }: { budgetId: string; data: UpdateBudgetBalance }) {
      return await updateBudgetBalanceDetail(budgetId, data);
    },
  });
};

export const useActivateBudgetMutation = () => {
  return useMutation({
    async mutationFn(budgetId: string) {
      return await activateBudget(budgetId);
    },
  });
};
