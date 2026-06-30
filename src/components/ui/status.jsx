import { cn } from "../../lib/utils";
import { StatusBadge } from "./badge";

const priorityStatus = {
  high: "urgent",
  med: "warning",
  medium: "warning",
  low: "neutral",
};

function PriorityBadge({ priority = "med", className }) {
  return (
    <StatusBadge status={priorityStatus[priority] || "neutral"} className={cn("uppercase", className)}>
      {priority}
    </StatusBadge>
  );
}

function HealthIndicator({ tone = "neutral", label, className }) {
  const tones = {
    red: "bg-destructive",
    amber: "bg-amber-400",
    green: "bg-emerald-400",
    blue: "bg-primary",
    purple: "bg-violet-400",
    neutral: "bg-muted-foreground",
    slate: "bg-muted-foreground",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full", tones[tone] || tones.neutral)} />
      {label}
    </span>
  );
}

export { PriorityBadge, HealthIndicator };
