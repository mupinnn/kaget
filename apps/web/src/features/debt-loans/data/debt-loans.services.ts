import { api } from "@/libs/api.lib";
import { unwrap } from "@/utils/api.util";
import type { CreateDebtLoan, DebtLoansRequestQuery, UpdateDebtLoan } from "./debt-loans.schemas";

export async function getDebtLoanList(query: DebtLoansRequestQuery = {}) {
  const result = await unwrap(
    api.api["debts-loans"].$get({
      query,
    })
  );

  return result.debt_loans;
}

export const getDebtLoanDetail = (debtLoanId: string) =>
  unwrap(api.api["debts-loans"][":id"].$get({ param: { id: debtLoanId } }));

export const createDebtLoan = (payload: CreateDebtLoan) =>
  unwrap(api.api["debts-loans"].$post({ json: payload }));

export const updateDebtLoan = (debtLoanId: string, payload: UpdateDebtLoan) =>
  unwrap(api.api["debts-loans"][":id"].$patch({ param: { id: debtLoanId }, json: payload }));

export const resolveDebtLoan = (debtLoanId: string) =>
  unwrap(api.api["debts-loans"][":id"].resolve.$post({ param: { id: debtLoanId } }));

export const deleteDebtLoan = (debtLoanId: string) =>
  unwrap(api.api["debts-loans"][":id"].$delete({ param: { id: debtLoanId } }));
