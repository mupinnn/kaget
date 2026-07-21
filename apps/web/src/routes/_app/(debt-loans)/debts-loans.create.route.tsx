import { createFileRoute } from "@tanstack/react-router";
import { DebtLoansFormPage } from "@/features/debt-loans/pages/debt-loans-form.page";

export const Route = createFileRoute("/_app/(debt-loans)/debts-loans/create")({
  component: DebtLoansFormPage,
});
