import { cn } from "../../lib/utils";

function SectionHeader({ title, count, action, className, tone = "neutral" }) {
  const tones = {
    neutral: "text-muted-foreground",
    red: "text-destructive",
    amber: "text-amber-400",
    green: "text-emerald-400",
    blue: "text-primary",
    purple: "text-violet-400",
  };

  return (
    <div className={cn("mb-2 mt-5 flex items-center justify-between gap-3", className)}>
      <div className={cn("text-xs font-bold uppercase tracking-[0.08em]", tones[tone] || tones.neutral)}>
        {title}
        {count !== undefined && <span className="ml-2 text-muted-foreground">{count}</span>}
      </div>
      {action}
    </div>
  );
}

export { SectionHeader };
