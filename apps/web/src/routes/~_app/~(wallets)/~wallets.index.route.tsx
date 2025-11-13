import { createFileRoute } from "@tanstack/react-router";
import { WalletsIndexPage } from "@/features/wallets/pages/wallets.page";

export const Route = createFileRoute("/_app/(wallets)/wallets/")({
  component: WalletsIndexPage,
});
