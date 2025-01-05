import { useMutation } from "@tanstack/react-query";
import { type CreateTransfer } from "./transfers.schemas";
import { createTransfer } from "./transfers.services";

export const useCreateTransferMutation = () => {
  return useMutation({
    async mutationFn(data: CreateTransfer) {
      return await createTransfer(data);
    },
  });
};
