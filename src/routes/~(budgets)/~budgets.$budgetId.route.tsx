import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(budgets)/budgets/$budgetId")({
  component: () => <div>Hello /(budgets)/budgets/$budgetId!</div>,
});
