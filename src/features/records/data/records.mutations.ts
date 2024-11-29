import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { recordsQueryOptions } from "./records.queries";
import { CreateRecordResponseSchema, CreateRecord } from "./records.schema";
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
      await queryClient.invalidateQueries(recordsQueryOptions);
      await queryClient.invalidateQueries(walletsQueryOptions());
      await queryClient.invalidateQueries(budgetsQueryOptions);
      await navigate({ to: "/records" });
    },
  });
};