import { createRootRoute, redirect } from "@tanstack/react-router";
import { preloadSettings } from "@/features/settings/data/settings.queries";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    await preloadSettings();

    if (!window.settings && !location.pathname.includes("onboarding")) {
      redirect({ to: "/onboarding", throw: true });
    }
  },
});
