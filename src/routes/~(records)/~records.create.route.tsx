import { createFileRoute } from "@tanstack/react-router";
import { RecordsFormPage } from "@/features/records/pages/records-form.page";

export const Route = createFileRoute("/(records)/records/create")({
  component: RecordsFormPage,
});
