import { test as setup } from "@playwright/test";

/**
 * Email/password auth was removed (#32). Feature e2e that need a session
 * resume after Google OAuth can be automated and/or Dexie restore (#40).
 */
setup.skip("authenticate onboarding-complete user", async () => {
  // Skipped: no credential sign-up path. Dependent projects skip with this setup.
});
