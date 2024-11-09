import { forwardRef } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/libs/utils.lib";

export interface HomeSectionProps extends React.ComponentProps<"section"> {
  title: string;
  to?: string;
  linkText?: string;
}

export const HomeSection = forwardRef<HTMLElement, HomeSectionProps>(
  ({ className, children, title, to, linkText, ...props }, ref) => (
    <section ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {to && linkText ? (
          <Link to={to} className="text-sm">
            {linkText}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
);
HomeSection.displayName = "HomeSection";
