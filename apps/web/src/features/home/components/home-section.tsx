import { Link } from "@tanstack/react-router";
import { cn } from "@/libs/utils.lib";

export interface HomeSectionProps extends React.ComponentProps<"section"> {
  title: string;
  description?: string;
  to?: "/" | "/wallets" | "/records" | "/budgets" | "/transfers" | "/debts-loans" | "/settings";
  linkText?: string;
}

export function HomeSection({
  className,
  children,
  title,
  description,
  to,
  linkText,
  ...props
}: HomeSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-semibold text-base tracking-tight">{title}</h2>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {to && linkText ? (
          <Link
            to={to}
            className="shrink-0 text-muted-foreground text-sm no-underline hover:text-foreground"
          >
            {linkText}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
