import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <nav className="container flex items-center justify-between border-b p-4">
      <Link to="/" className="font-bold [&.active]:underline">
        KaGet
      </Link>

      <Button variant="ghost" size="icon">
        <EyeIcon />
      </Button>
    </nav>
  );
}
