import * as React from "react";
import { cn } from "../../lib/utils";

function Popover({ open, children }) {
  return <div className="relative inline-block">{typeof children === "function" ? children({ open }) : children}</div>;
}

const PopoverTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <button ref={ref} type="button" className={cn("inline-flex items-center justify-center", className)} {...props} />
));
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef(({ className, align = "center", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 mt-2 w-72 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-soft",
      align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2",
      className
    )}
    {...props}
  />
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
