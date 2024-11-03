import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(budgets)/budgets/")({
  component: () => <div>Hello /(budgets)/budgets/!</div>,
});
