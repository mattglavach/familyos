import * as React from "react";
import { cn } from "../../lib/utils";

const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={Boolean(checked)}
    data-state={checked ? "checked" : "unchecked"}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
      className
    )}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
  >
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
));
Switch.displayName = "Switch";

export { Switch };
