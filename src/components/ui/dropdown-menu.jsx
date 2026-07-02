import * as React from "react";
import { cn } from "../../lib/utils";

function DropdownMenu({ open, children }) {
  return <div className="relative inline-block text-left">{typeof children === "function" ? children({ open }) : children}</div>;
}

const DropdownMenuTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <button ref={ref} type="button" className={cn("inline-flex items-center justify-center", className)} {...props} />
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef(({ className, align = "end", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 mt-2 min-w-44 rounded-lg border border-border bg-card p-1 text-card-foreground shadow-soft",
      align === "end" ? "right-0" : "left-0",
      className
    )}
    {...props}
  />
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn("flex min-h-9 w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none", className)}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
