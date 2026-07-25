import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RECORDS_QUERY_KEY } from "@/features/records/data/records.queries";
import { WALLETS_QUERY_KEY } from "@/features/wallets/data/wallets.queries";
import { DEBT_LOANS_QUERY_KEY } from "./debt-loans.queries";
import type { CreateDebtLoan, UpdateDebtLoan } from "./debt-loans.schemas";
import {
  createDebtLoan,
  deleteDebtLoan,
  resolveDebtLoan,
  updateDebtLoan,
} from "./debt-loans.services";

export const useCreateDebtLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDebtLoan) => createDebtLoan(data),
    meta: { successMessage: "Successfully created debt/loan" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [DEBT_LOANS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
};

export const useUpdateDebtLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtLoanId, data }: { debtLoanId: string; data: UpdateDebtLoan }) =>
      updateDebtLoan(debtLoanId, data),
    meta: { successMessage: "Successfully updated debt/loan" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [DEBT_LOANS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};

export const useResolveDebtLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (debtLoanId: string) => resolveDebtLoan(debtLoanId),
    meta: { successMessage: "Successfully resolved debt/loan" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [DEBT_LOANS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
};

export const useDeleteDebtLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (debtLoanId: string) => deleteDebtLoan(debtLoanId),
    meta: { successMessage: "Successfully deleted debt/loan" },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [DEBT_LOANS_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [WALLETS_QUERY_KEY] });
    },
  });
};
