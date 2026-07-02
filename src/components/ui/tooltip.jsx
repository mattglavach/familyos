import * as React from "react";
import { cn } from "../../lib/utils";

function Tooltip({ children }) {
  return <span className="group relative inline-flex">{children}</span>;
}

const TooltipTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("inline-flex", className)} {...props} />
));
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef(({ className, side = "top", ...props }, ref) => (
  <span
    ref={ref}
    role="tooltip"
    className={cn(
      "pointer-events-none absolute z-50 rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-card-foreground opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
      side === "bottom" ? "left-1/2 top-full mt-2 -translate-x-1/2" : "bottom-full left-1/2 mb-2 -translate-x-1/2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent };
