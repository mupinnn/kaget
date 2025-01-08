import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { ThemeSelector } from "./theme-selector";
import { ToggleHidableBalance } from "./hidable-balance";

export function AppNavbar() {
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
      </div>
    </nav>
  );
}
