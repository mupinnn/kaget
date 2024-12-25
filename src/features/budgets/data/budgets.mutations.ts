import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { walletsQueryOptions } from "@/features/wallets/data/wallets.queries";
import { budgetsQueryOptions } from "./budgets.queries";
import {
  CreateBudget,
  CreateBudgetResponseSchema,
  DeleteBudgetResponseSchema,
  RefundBudget,
  RefundBudgetResponseSchema,
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

export const useRefundBudgetMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    async mutationFn({ budgetId, data }: { budgetId: string; data: RefundBudget }) {
      const res = await api.patch(data, `/budgets/${budgetId}/refund`);
      return RefundBudgetResponseSchema.parse(res);
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
