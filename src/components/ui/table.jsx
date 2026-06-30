import { cn } from "../../lib/utils";
import { EmptyStatePanel } from "./empty-state";

function StandardTableHeader({ columns, className }) {
  return (
    <div className={cn("grid gap-3 border-b border-border pb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground", className)}>
      {columns.map(column => (
        <div key={column}>{column}</div>
      ))}
    </div>
  );
}

function EmptyTableState({ title = "No rows yet", detail, action, onAction }) {
  return <EmptyStatePanel title={title} detail={detail} action={action} onAction={onAction} className="py-8" />;
}

export { StandardTableHeader, EmptyTableState };
