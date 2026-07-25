import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WALLETS_QUERY_KEY } from "./wallets.queries";
import type { CreateWallet, UpdateWallet } from "./wallets.schemas";
import { createWallet, deleteWallet, updateWalletDetail } from "./wallets.services";

export const useCreateWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWallet) => createWallet(data),
    meta: { successMessage: "Successfully created wallet" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};

export const useDeleteWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletId: string) => deleteWallet(walletId),
    meta: { successMessage: "Successfully deleted wallet" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};

export const useUpdateWalletMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletId, data }: { walletId: string; data: UpdateWallet }) =>
      updateWalletDetail(walletId, data),
    meta: { successMessage: "Successfully updated wallet" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};
