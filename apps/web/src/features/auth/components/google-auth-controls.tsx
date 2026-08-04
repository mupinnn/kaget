import { useNavigate } from "@tanstack/react-router";
import { LogInIcon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut, useSession } from "@/libs/auth.lib";

type GoogleAuthControlsProps = {
  className?: string;
  /** Compact icon buttons for the navbar; labeled buttons elsewhere. */
  compact?: boolean;
};

export function GoogleAuthControls({ className, compact = false }: GoogleAuthControlsProps) {
  const navigate = useNavigate();
  const session = useSession();
  const user = session.data?.user;
  const isPending = session.isPending;

  async function handleSignIn() {
    const { error } = await signInWithGoogle("/");
    if (error) {
      toast.error(error.message ?? "Google sign-in failed");
    }
  }

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message ?? "Sign out failed");
      return;
    }
    await navigate({ to: "/" });
  }

  if (isPending) {
    return null;
  }

  if (user) {
    if (compact) {
      return (
        <Button
          className={className}
          onClick={handleSignOut}
          size="icon"
          type="button"
          variant="ghost"
        >
          <LogOutIcon className="size-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      );
    }

    return (
      <div className={className}>
        <p className="mb-2 text-muted-foreground text-sm">{user.email}</p>
        <Button onClick={handleSignOut} type="button" variant="outline">
          <LogOutIcon className="size-4" />
          Sign out
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        className={className}
        onClick={handleSignIn}
        size="icon"
        type="button"
        variant="ghost"
      >
        <LogInIcon className="size-4" />
        <span className="sr-only">Continue with Google</span>
      </Button>
    );
  }

  return (
    <Button className={className} onClick={handleSignIn} type="button">
      <LogInIcon className="size-4" />
      Continue with Google
    </Button>
  );
}
