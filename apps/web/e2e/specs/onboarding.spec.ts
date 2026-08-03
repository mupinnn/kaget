import { test } from "../fixtures/test";

test.describe("Onboarding", () => {
  test.skip(true, "Onboarding still assumes authenticated settings API; resume with Dexie #40");

  test("completes onboarding and lands on home", async () => {
    // Placeholder until local settings/onboarding work without a Google session.
  });
});
