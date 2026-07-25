import { createRootRoute, redirect } from "@tanstack/react-router";
import { getSession, hydrateSettings, isAuthenticatedSession } from "@/libs/session.lib";

const authPaths = ["/sign-in", "/sign-up"];

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const isAuthPath = authPaths.some(path => location.pathname.startsWith(path));
    const isOnboarding = location.pathname.includes("onboarding");
    const session = await getSession();
    const isAuthenticated = isAuthenticatedSession(session);

    if (!isAuthenticated) {
      if (!isAuthPath) {
        redirect({ to: "/sign-in", throw: true });
      }

      return;
    }

    if (isAuthPath) {
      redirect({ to: "/", throw: true });
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
