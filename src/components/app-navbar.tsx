import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";

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

      <Button variant="ghost" size="icon">
        <EyeIcon />
      </Button>
    </nav>
  );
}
