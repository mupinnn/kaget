import { createRootRoute, redirect } from "@tanstack/react-router";
import { hydrateSettings } from "@/libs/session.lib";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const isOnboarding = location.pathname.includes("onboarding");
    const settings = await hydrateSettings();

    if (!settings && !isOnboarding) {
      redirect({ to: "/onboarding", throw: true });
    }

    if (settings && isOnboarding) {
      redirect({ to: "/", throw: true });
    }
  },
});
