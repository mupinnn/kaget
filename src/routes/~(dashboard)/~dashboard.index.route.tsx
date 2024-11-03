import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/dashboard/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  return <p>Dashboard index</p>;
}
