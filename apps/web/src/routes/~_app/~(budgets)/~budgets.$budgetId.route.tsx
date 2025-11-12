import { createFileRoute } from "@tanstack/react-router";
import { BudgetsDetailPage } from "@/features/budgets/pages/budgets-detail.page";

export const Route = createFileRoute("/_app/(budgets)/budgets/$budgetId")({
  component: BudgetsDetailPage,
});
