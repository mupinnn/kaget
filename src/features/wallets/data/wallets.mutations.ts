import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { CreateWallet, CreateWalletResponseSchema } from "./wallets.schema";

export const useCreateWalletMutation = () => {
  const navigate = useNavigate();

  return useMutation({
    async mutationFn(data: CreateWallet) {
      const res = await api.post(data, "/wallets");
      return CreateWalletResponseSchema.parse(res);
    },
    async onSuccess() {
      await navigate({ to: "/wallets" });
    },
  });
};
