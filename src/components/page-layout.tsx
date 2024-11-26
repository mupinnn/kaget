import { cn } from "@/libs/utils.lib";

interface PageLayoutProps {
  title: React.ReactNode;
  titleClassName?: string;
  subtitle?: React.ReactNode;
  subtitleClassName?: string;
  children?: React.ReactNode;
}

export function PageLayout({
  title,
  titleClassName,
  subtitle,
  subtitleClassName,
  children,
}: PageLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className={cn("text-3xl font-bold", titleClassName)}>{title}</h1>
        {subtitle ? (
          <p className={cn("text-sm text-muted-foreground", subtitleClassName)}>{subtitle}</p>
        ) : null}
      </div>

      {children}
    </div>
  );
}
