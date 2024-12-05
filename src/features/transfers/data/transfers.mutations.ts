import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { walletsQueryOptions } from "@/features/wallets/data/wallets.queries";
import { CreateTransfer, CreateTransferResponseSchema } from "./transfers.schema";
import { transfersQueryOptions } from "./transfers.queries";

export const useCreateTransferMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    async mutationFn(data: CreateTransfer) {
      const res = await api.post(data, "/transfers");
      return CreateTransferResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ ...transfersQueryOptions(), exact: false });
      await queryClient.invalidateQueries({ ...walletsQueryOptions(), exact: false });
      await navigate({ to: "/transfers" });
    },
  });
};
