import { createFileRoute } from "@tanstack/react-router";
import { DebtLoansIndexPage } from "@/features/debt-loans/pages/debt-loans.page";

export const Route = createFileRoute("/_app/(debt-loans)/debts-loans/")({
  component: DebtLoansIndexPage,
});
