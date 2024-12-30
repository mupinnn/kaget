import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(settings)/settings/")({
  component: () => <div>Hello /(settings)/settings/!</div>,
});
