import { createFileRoute } from "@tanstack/react-router";
import { SettingsIndexPage } from "@/features/settings/pages/settings.page";

export const Route = createFileRoute("/_app/(settings)/settings/")({
  component: SettingsIndexPage,
});
