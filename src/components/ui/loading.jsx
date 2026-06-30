import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

function LoadingCard({ lines = 3, className, children }) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-5">
        {children}
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className={index === 0 ? "h-4 w-4/5" : index === lines - 1 ? "h-3 w-2/5" : "h-3 w-3/5"} />
        ))}
      </CardContent>
    </Card>
  );
}

function LoadingMetric({ className }) {
  return (
    <div className={className}>
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function LoadingTable({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-3 gap-3 rounded-lg border border-border p-3">
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
        </div>
      ))}
    </div>
  );
}

export { LoadingCard, LoadingMetric, LoadingTable };
