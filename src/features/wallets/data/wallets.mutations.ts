import { useMutation } from "@tanstack/react-query";
import { api } from "@/libs/api.lib";
import { CreateWallet } from "./wallets.schema";

export const useCreateWalletMutation = () => {
  return useMutation({
    async mutationFn(data: CreateWallet) {
      const res = await api.post(data, "/wallets");
      return res;
    },
    onSuccess(...args) {
      console.log("success: ", args);
    },
  });
};
