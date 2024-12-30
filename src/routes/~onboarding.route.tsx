import { createFileRoute } from "@tanstack/react-router";
import { OnboardingIndexPage } from "@/features/onboarding/pages/onboarding.page";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingIndexPage,
});
