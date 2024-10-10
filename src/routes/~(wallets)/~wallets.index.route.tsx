import { createFileRoute } from "@tanstack/react-router";
import { WalletsIndexPage } from "@/features/wallets/pages/wallets.page";

export const Route = createFileRoute("/(wallets)/wallets/")({
  component: WalletsIndexPage,
});
