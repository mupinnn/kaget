import { createFileRoute } from "@tanstack/react-router";
import { TransfersIndexPage } from "@/features/transfers/pages/transfers.page";

export const Route = createFileRoute("/(transfers)/transfers/")({
  component: TransfersIndexPage,
});
