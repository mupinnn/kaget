import { createFileRoute } from "@tanstack/react-router";
import { TransfersDetailPage } from "@/features/transfers/pages/transfers-detail.page";

export const Route = createFileRoute("/(transfers)/transfers/$transferId")({
  component: TransfersDetailPage,
});
