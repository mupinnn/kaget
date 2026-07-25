import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import type { DebtLoansRequestQuery } from "./debt-loans.schemas";
import { getDebtLoanDetail, getDebtLoanList } from "./debt-loans.services";

export const DEBT_LOANS_QUERY_KEY = "debt-loans";

export const debtLoansQueryOptions = (req: DebtLoansRequestQuery = {}) =>
  queryOptions({
    queryKey: [DEBT_LOANS_QUERY_KEY, req],
    queryFn: () => getDebtLoanList(req),
  });

export const useDebtLoansQuery = (req: DebtLoansRequestQuery = {}) =>
  useQuery(debtLoansQueryOptions(req));

export const debtLoanDetailQueryOptions = (debtLoanId?: string) =>
  queryOptions({
    queryKey: [DEBT_LOANS_QUERY_KEY, debtLoanId],
    queryFn: debtLoanId ? () => getDebtLoanDetail(debtLoanId) : skipToken,
  });

export const useDebtLoanDetailQuery = (debtLoanId?: string) =>
  useQuery(debtLoanDetailQueryOptions(debtLoanId));
