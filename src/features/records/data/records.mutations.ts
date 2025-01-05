import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type CreateRecord } from "./records.schemas";
import { createRecord, deleteRecord } from "./records.services";
import { WALLETS_QUERY_KEY } from "@/features/wallets/data/wallets.queries";
import { BUDGETS_QUERY_KEY } from "@/features/budgets/data/budgets.queries";
import { RECORDS_QUERY_KEY } from "./records.queries";

export const useCreateRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(data: CreateRecord) {
      return await createRecord(data);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
    },
  });
};

export const useDeleteRecordMutation = () => {
  return useMutation({
    async mutationFn(recordId: string) {
      return await deleteRecord(recordId);
    },
  });
};
