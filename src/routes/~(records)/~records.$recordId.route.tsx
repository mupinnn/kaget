import { createFileRoute } from "@tanstack/react-router";
import { RecordsDetailPage } from "@/features/records/pages/records-detail.page";

export const Route = createFileRoute("/(records)/records/$recordId")({
  component: RecordsDetailPage,
});
