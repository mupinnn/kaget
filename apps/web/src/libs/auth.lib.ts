import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, useSession } = authClient;

export async function signInWithGoogle(callbackURL = "/") {
  return signIn.social({
    provider: "google",
    callbackURL,
  });
}
