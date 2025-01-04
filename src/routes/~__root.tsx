import { createRootRoute, redirect } from "@tanstack/react-router";
import { getSettings } from "@/features/settings/data/settings.services";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const settings = await getSettings();

    if (!settings.data && !location.pathname.includes("onboarding")) {
      redirect({ to: "/onboarding", throw: true });
    }
  },
});
