import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { walletsQueryOptions } from "@/features/wallets/data/wallets.queries";
import { budgetsDetailQueryOptions, budgetsQueryOptions } from "./budgets.queries";
import {
  CreateBudget,
  CreateBudgetResponseSchema,
  DeleteBudgetResponseSchema,
  UpdateBudgetBalance,
  UpdateBudgetBalanceResponseSchema,
} from "./budgets.schema";
import { transfersQueryOptions } from "@/features/transfers/data/transfers.queries";
import { recordsQueryOptions } from "@/features/records/data/records.queries";

export const useCreateBudgetMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    async mutationFn(data: CreateBudget) {
      const res = await api.post(data, "/budgets");
      return CreateBudgetResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ ...budgetsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...walletsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...transfersQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...recordsQueryOptions(), exact: false });
      await navigate({ to: "/budgets" });
    },
  });
};

export const useDeletBudgetMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    async mutationFn(budgetId: string) {
      const res = await api.delete(`/budgets/${budgetId}`);
      return DeleteBudgetResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ ...budgetsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...walletsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...transfersQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...recordsQueryOptions(), exact: false });
      await navigate({ to: "/budgets" });
    },
  });
};

export const useUpdateBudgetBalanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn({ budgetId, data }: { budgetId: string; data: UpdateBudgetBalance }) {
      const res = await api.patch(data, `/budgets/${budgetId}/balance`);
      return UpdateBudgetBalanceResponseSchema.parse(res);
    },
    async onSuccess(data) {
      await queryClient.invalidateQueries({ ...budgetsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...walletsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...transfersQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...recordsQueryOptions(), exact: false });
      await queryClient.refetchQueries(budgetsDetailQueryOptions(data.data.id));
    },
  });
};
