import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(wallets)/wallets/$walletId")({
  component: () => <div>Hello /(accounts)/accounts/$accountId!</div>,
});
