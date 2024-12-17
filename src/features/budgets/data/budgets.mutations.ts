import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/libs/api.lib";
import { budgetsQueryOptions } from "./budgets.queries";
import { CreateBudget, CreateBudgetResponseSchema } from "./budgets.schema";

export const useCreateBudgetMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    async mutationFn(data: CreateBudget) {
      const res = await api.post(data, "/budgets");
      return CreateBudgetResponseSchema.parse(res);
    },
    async onSuccess() {
      await queryClient.invalidateQueries(budgetsQueryOptions);
      await navigate({ to: "/" });
    },
  });
};
