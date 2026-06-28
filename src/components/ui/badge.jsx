import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        red: "border-destructive/35 bg-destructive/15 text-destructive",
        amber: "border-amber-400/35 bg-amber-400/15 text-amber-300",
        green: "border-emerald-400/35 bg-emerald-400/15 text-emerald-300",
        blue: "border-primary/35 bg-primary/15 text-primary",
        purple: "border-violet-400/35 bg-violet-400/15 text-violet-300",
        slate: "border-border bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const statusToneByValue = {
  overdue: "red",
  urgent: "red",
  unsafe: "red",
  failed: "red",
  warning: "amber",
  due: "amber",
  monitor: "amber",
  complete: "green",
  healthy: "green",
  safe: "green",
  success: "green",
  info: "blue",
  connected: "blue",
  selected: "blue",
  important: "purple",
  neutral: "slate",
  unknown: "slate",
};

function StatusBadge({ status = "neutral", children, className, ...props }) {
  const variant = statusToneByValue[status] || status;
  return (
    <Badge variant={variant} className={cn("capitalize", className)} {...props}>
      {children || String(status).replace(/-/g, " ")}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
