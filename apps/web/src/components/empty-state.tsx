import * as React from "react";
import { cn } from "@/libs/utils.lib";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ title, icon, description, actions, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center",
        className
      )}
      {...props}
    >
      {icon &&
        React.createElement(icon, {
          "aria-hidden": true,
          className: "h-12 w-12 text-muted-foreground",
        })}
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {actions}
    </div>
  )
);
EmptyState.displayName = "EmptyState";
