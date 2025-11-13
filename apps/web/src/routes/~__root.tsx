import { createRootRoute, redirect } from "@tanstack/react-router";
import { preloadSettings } from "@/features/settings/data/settings.services";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (!window.settings) await preloadSettings();

    if (!window.settings && !location.pathname.includes("onboarding")) {
      redirect({ to: "/onboarding", throw: true });
    }

    if (window.settings && location.pathname.includes("onboarding")) {
      redirect({ to: "/", throw: true });
    }
  },
});
