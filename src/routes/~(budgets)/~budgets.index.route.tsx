import { createFileRoute } from "@tanstack/react-router";
import { BudgetsIndexPage } from "@/features/budgets/pages/budgets.page";

export const Route = createFileRoute("/(budgets)/budgets/")({
  component: BudgetsIndexPage,
});
