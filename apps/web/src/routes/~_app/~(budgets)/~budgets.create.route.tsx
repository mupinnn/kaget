import { createFileRoute } from "@tanstack/react-router";
import { BudgetsFormPage } from "@/features/budgets/pages/budgets-form.page";

export const Route = createFileRoute("/_app/(budgets)/budgets/create")({
  component: BudgetsFormPage,
});
