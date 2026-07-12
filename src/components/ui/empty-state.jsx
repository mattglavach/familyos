import { Button } from "./button";
import { cn } from "../../lib/utils";

function EmptyStatePanel({ icon, title = "Nothing here yet", detail, action, onAction, className }) {
  return (
    <div className={cn("px-4 py-4 text-center", className)}>
      {icon && <div className="mb-2 text-2xl opacity-70">{icon}</div>}
      <div className="text-sm font-bold text-secondary-foreground">{title}</div>
      {detail && <div className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{detail}</div>}
      {action && onAction && (
        <Button type="button" size="sm" className="mt-3" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

export { EmptyStatePanel };
