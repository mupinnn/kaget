import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { recordsQueryOptions } from "./records.queries";
import {
  CreateRecordResponseSchema,
  CreateRecord,
  DeleteRecordResponseSchema,
} from "./records.schema";
import { walletsQueryOptions } from "@/features/wallets/data/wallets.queries";
import { budgetsQueryOptions } from "@/features/budgets/data/budgets.queries";

export const useCreateRecordMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(data: CreateRecord) {
      const res = await api.post(data, "/records");
      return CreateRecordResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ ...recordsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...walletsQueryOptions(), exact: false });
      await queryClient.invalidateQueries(budgetsQueryOptions);
      await navigate({ to: "/records" });
    },
  });
};

export const useDeleteRecordMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(recordId: string) {
      const res = await api.delete(`/records/${recordId}`);
      return DeleteRecordResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ ...recordsQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...walletsQueryOptions(), exact: false });
      await queryClient.invalidateQueries(budgetsQueryOptions);
      await navigate({ to: "/records" });
    },
  });
};
