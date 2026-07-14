import * as React from "react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const IconAction = React.forwardRef(function IconAction(
  { label, icon: Icon, size = "icon-xs", variant = "ghost", destructive = false, loading = false, ...props },
  ref,
) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          ref={ref}
          type="button"
          size={size}
          variant={destructive ? "destructive-outline" : variant}
          loading={loading}
          aria-label={label}
          title={label}
          {...props}
        >
          <Icon aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
});

export { IconAction };
