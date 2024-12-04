import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(transfers)/transfers/")({
  component: () => <div>Hello /(transfers)/transfers/!</div>,
});
