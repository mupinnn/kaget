import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(transfers)/transfers/$transferId")({
  component: () => <div>Hello /(transfers)/transfers/$transferId!</div>,
});
