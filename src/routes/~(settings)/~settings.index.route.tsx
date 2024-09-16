import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(settings)/settings/")({
  component: () => <div>Hello /(settings)/settings/!</div>,
});
