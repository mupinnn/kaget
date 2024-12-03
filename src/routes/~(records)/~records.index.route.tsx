import { createFileRoute } from "@tanstack/react-router";
import { RecordsIndexPage } from "@/features/records/pages/records.page";

export const Route = createFileRoute("/(records)/records/")({
  component: RecordsIndexPage,
});
