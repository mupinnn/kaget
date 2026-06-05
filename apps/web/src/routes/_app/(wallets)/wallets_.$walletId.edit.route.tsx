import { createFileRoute } from "@tanstack/react-router";
import { WalletsFormPage } from "@/features/wallets/pages/wallets-form.page";

export const Route = createFileRoute("/_app/(wallets)/wallets_/$walletId/edit")({
  component: WalletsFormPage,
});
