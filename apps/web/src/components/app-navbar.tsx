import { Link, useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/libs/auth.lib";
import { ToggleHidableBalance } from "./hidable-balance";
import { ThemeSelector } from "./theme-selector";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function AppNavbar() {
  const navigate = useNavigate();

  async function handleSignOut() {
    const { error } = await signOut();

    if (error) {
      toast.error(error.message ?? "Sign out failed");
      return;
    }

    await navigate({ to: "/sign-in" });
  }

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-1 h-4" />
        <Link to="/" className="font-bold [&.active]:underline">
          KaGet
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ToggleHidableBalance />
        <ThemeSelector />
        <Button onClick={handleSignOut} size="icon" type="button" variant="ghost">
          <LogOutIcon className="size-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </nav>
  );
}
