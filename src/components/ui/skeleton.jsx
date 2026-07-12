import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

function CardSkeleton({ count = 1, className }) {
  return <div className={cn("space-y-3", className)} aria-label="Loading cards" role="status">
    {Array.from({ length: count }, (_, index) => <div key={index} className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/5" />
    </div>)}
    <span className="sr-only">Loading</span>
  </div>;
}

function ListSkeleton({ rows = 4, className }) {
  return <div className={cn("divide-y divide-border rounded-xl border border-border bg-card px-4", className)} aria-label="Loading list" role="status">
    {Array.from({ length: rows }, (_, index) => <div key={index} className="space-y-2 py-3">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-2/5" />
    </div>)}
    <span className="sr-only">Loading</span>
  </div>;
}

function TableSkeleton({ rows = 4, columns = 3, className }) {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)} aria-label="Loading table" role="status">
    {Array.from({ length: rows }, (_, row) => <div key={row} className="grid gap-3 border-b border-border p-3 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }, (_, column) => <Skeleton key={column} className="h-3 w-full" />)}
    </div>)}
    <span className="sr-only">Loading</span>
  </div>;
}

export { Skeleton, CardSkeleton, ListSkeleton, TableSkeleton };
