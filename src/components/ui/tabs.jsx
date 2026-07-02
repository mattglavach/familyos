import * as React from "react";
import { cn } from "../../lib/utils";

function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn("w-full", className)} data-value={value}>
      {typeof children === "function" ? children({ value, onValueChange }) : children}
    </div>
  );
}

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} role="tablist" className={cn("inline-flex min-h-10 items-center rounded-lg border border-border bg-card p-1", className)} {...props} />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, active, onValueChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="tab"
    aria-selected={Boolean(active)}
    data-state={active ? "active" : "inactive"}
    className={cn(
      "inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      className
    )}
    onClick={() => onValueChange?.(value)}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, active = true, ...props }, ref) => (
  <div ref={ref} hidden={!active} role="tabpanel" className={cn("mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
