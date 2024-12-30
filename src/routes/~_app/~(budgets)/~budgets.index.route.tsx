import { createFileRoute } from "@tanstack/react-router";
import { BudgetsIndexPage } from "@/features/budgets/pages/budgets.page";

export const Route = createFileRoute("/_app/(budgets)/budgets/")({
  component: BudgetsIndexPage,
});
