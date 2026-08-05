import { Link } from "@tanstack/react-router";
import { ToggleHidableBalance } from "./hidable-balance";
import { ThemeSelector } from "./theme-selector";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function AppNavbar() {
  return (
    <nav className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="size-8 shrink-0" />
        <Separator orientation="vertical" className="h-4" />
        <Link
          to="/"
          className="truncate font-semibold tracking-tight no-underline [&.active]:text-foreground"
        >
          KaGet
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ToggleHidableBalance />
        <ThemeSelector />
      </div>
    </nav>
  );
}
