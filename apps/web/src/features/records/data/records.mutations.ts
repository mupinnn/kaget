import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BUDGETS_QUERY_KEY } from "@/features/budgets/data/budgets.queries";
import { WALLETS_QUERY_KEY } from "@/features/wallets/data/wallets.queries";
import { RECORDS_QUERY_KEY } from "./records.queries";
import type { CreateRecordForm } from "./records.schemas";
import { createRecord, deleteRecord } from "./records.services";

export const useCreateRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecordForm) => createRecord(data),
    meta: { successMessage: "Successfully created record" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
    },
  });
};

export const useDeleteRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordId: string) => deleteRecord(recordId),
    meta: { successMessage: "Successfully deleted record" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
};
