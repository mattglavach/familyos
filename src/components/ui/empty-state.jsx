import { Button } from "./button";
import { cn } from "../../lib/utils";

function EmptyStatePanel({ icon, title = "Nothing here yet", detail, action, onAction, className }) {
  return (
    <div className={cn("px-6 py-10 text-center", className)}>
      {icon && <div className="mb-3 text-4xl opacity-70">{icon}</div>}
      <div className="mb-2 text-base font-bold text-secondary-foreground">{title}</div>
      {detail && <div className="mx-auto mb-5 max-w-64 text-sm leading-6 text-muted-foreground">{detail}</div>}
      {action && onAction && (
        <Button type="button" size="lg" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

export { EmptyStatePanel };
