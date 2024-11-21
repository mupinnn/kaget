import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import {
  CreateWallet,
  CreateWalletResponseSchema,
  DeleteWalletResponseSchema,
} from "./wallets.schema";
import { walletsQueryOptions } from "./wallets.queries";

export const useCreateWalletMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(data: CreateWallet) {
      const res = await api.post(data, "/wallets");
      return CreateWalletResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries(walletsQueryOptions);
      await navigate({ to: "/wallets" });
    },
  });
};

export const useDeleteWalletMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(data: string) {
      const res = await api.delete(`/wallets/${data}`);
      return DeleteWalletResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: walletsQueryOptions.queryKey,
        refetchType: "none",
      });
      await navigate({ to: "/wallets" });
    },
  });
};
