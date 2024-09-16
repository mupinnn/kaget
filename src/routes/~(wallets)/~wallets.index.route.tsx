import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(wallets)/wallets/")({
  component: () => <div>Hello /(accounts)/accounts/!</div>,
});
