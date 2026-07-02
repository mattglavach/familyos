import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="checkbox"
    aria-checked={Boolean(checked)}
    data-state={checked ? "checked" : "unchecked"}
    className={cn(
      "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-secondary text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
      className
    )}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
  >
    {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
  </button>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
