import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/features/auth/pages/sign-in.page";

export const Route = createFileRoute("/(auth)/sign-in")({
  component: SignInPage,
});
