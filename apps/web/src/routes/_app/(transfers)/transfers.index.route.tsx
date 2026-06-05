import { createFileRoute } from "@tanstack/react-router";
import { TransfersIndexPage } from "@/features/transfers/pages/transfers.page";

export const Route = createFileRoute("/_app/(transfers)/transfers/")({
  component: TransfersIndexPage,
});
