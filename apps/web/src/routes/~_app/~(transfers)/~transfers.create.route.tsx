import { createFileRoute } from "@tanstack/react-router";
import { TransfersFormPage } from "@/features/transfers/pages/transfers-form.page";

export const Route = createFileRoute("/_app/(transfers)/transfers/create")({
  component: TransfersFormPage,
});
