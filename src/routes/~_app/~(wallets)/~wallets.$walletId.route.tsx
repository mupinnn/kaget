import { createFileRoute } from "@tanstack/react-router";
import { WalletsDetailPage } from "@/features/wallets/pages/wallets-detail.page";

export const Route = createFileRoute("/_app/(wallets)/wallets/$walletId")({
  component: WalletsDetailPage,
});
