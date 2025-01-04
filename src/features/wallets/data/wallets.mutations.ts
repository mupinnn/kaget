import { useMutation } from "@tanstack/react-query";
import { type CreateWallet, type UpdateWallet } from "./wallets.schemas";
import { createWallet, updateWalletDetail, deleteWallet } from "./wallets.services";

export const useCreateWalletMutation = () => {
  return useMutation({
    async mutationFn(data: CreateWallet) {
      return await createWallet(data);
    },
  });
};

export const useDeleteWalletMutation = () => {
  return useMutation({
    async mutationFn(data: string) {
      return await deleteWallet(data);
    },
  });
};

export const useUpdateWalletMutation = () => {
  return useMutation({
    async mutationFn({ walletId, data }: { walletId: string; data: UpdateWallet }) {
      return await updateWalletDetail(walletId, data);
    },
  });
};
