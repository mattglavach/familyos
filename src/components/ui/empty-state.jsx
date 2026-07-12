import { Button } from "./button";
import { cn } from "../../lib/utils";

function EmptyStatePanel({ icon, title = "Nothing here yet", detail, action, onAction, className }) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-5 text-center", className)}>
      {icon && <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl text-muted-foreground" aria-hidden="true">{icon}</div>}
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
