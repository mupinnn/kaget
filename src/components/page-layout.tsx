import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { match, P } from "ts-pattern";
import { cn } from "@/libs/utils.lib";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface PageLayoutProps {
  title: React.ReactNode;
  titleClassName?: string;
  subtitle?: React.ReactNode;
  subtitleClassName?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageLayout({
  title,
  titleClassName,
  subtitle,
  subtitleClassName,
  badge,
  children,
}: PageLayoutProps) {
  return (
    <div className="space-y-4">
      <Button asChild className="no-underline" size="icon" variant="outline">
        <Link to="..">
          <ChevronLeftIcon />
        </Link>
      </Button>

      <div className="space-y-1">
        {match(badge)
          .with(P.string, () => <Badge variant="secondary">{badge}</Badge>)
          .otherwise(() => null)}

        <h1 className={cn("text-3xl font-bold", titleClassName)}>{title}</h1>

        {match(subtitle)
          .with(P.string, () => (
            <p className={cn("text-sm text-muted-foreground", subtitleClassName)}>{subtitle}</p>
          ))
          .with(P._, () => subtitle)
          .otherwise(() => null)}
      </div>

      {children}
    </div>
  );
}
