import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BUDGETS_QUERY_KEY } from "@/features/budgets/data/budgets.queries";
import { WALLETS_QUERY_KEY } from "@/features/wallets/data/wallets.queries";
import { TRANSFERS_QUERY_KEY } from "./transfers.queries";
import type { CreateTransferForm } from "./transfers.schemas";
import { createTransfer } from "./transfers.services";

export const useCreateTransferMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferForm) => createTransfer(data),
    meta: { successMessage: "Successfully created transfer" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TRANSFERS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
    },
  });
};
