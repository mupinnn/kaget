import { createRootRoute, redirect } from "@tanstack/react-router";
import { getSession, hydrateSettings, isAuthenticatedSession } from "@/libs/session.lib";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const isOnboarding = location.pathname.includes("onboarding");
    const session = await getSession();
    const isAuthenticated = isAuthenticatedSession(session);

    // Local use needs no login — skip settings API when signed out (#32).
    if (!isAuthenticated) {
      return;
    }

    if (!window.settings) {
      await hydrateSettings();
    }

    if (!window.settings && !isOnboarding) {
      redirect({ to: "/onboarding", throw: true });
    }

    if (window.settings && isOnboarding) {
      redirect({ to: "/", throw: true });
    }
  },
});
