import { createFileRoute } from "@tanstack/react-router";
import { DebtLoansDetailPage } from "@/features/debt-loans/pages/debt-loans-detail.page";

export const Route = createFileRoute("/_app/(debt-loans)/debts-loans/$debtLoanId")({
  component: DebtLoansDetailPage,
});
