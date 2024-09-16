import { createFileRoute } from "@tanstack/react-router";
import { BudgetsDetailPage } from "@/features/budgets/pages/budgets-detail.page";

export const Route = createFileRoute("/(budgets)/budgets/$budgetId")({
  component: BudgetsDetailPage,
});
