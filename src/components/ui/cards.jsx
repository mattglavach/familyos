import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";

const toneClasses = {
  neutral: "border-border",
  red: "border-l-destructive",
  amber: "border-l-amber-400",
  green: "border-l-emerald-400",
  blue: "border-l-primary",
  purple: "border-l-violet-400",
  slate: "border-l-muted-foreground",
};

const textToneClasses = {
  neutral: "text-muted-foreground",
  red: "text-destructive",
  amber: "text-amber-300",
  green: "text-emerald-300",
  blue: "text-primary",
  purple: "text-violet-300",
  slate: "text-muted-foreground",
};

function cardTone(tone) {
  return toneClasses[tone] || toneClasses.neutral;
}

function textTone(tone) {
  return textToneClasses[tone] || textToneClasses.neutral;
}

function SummaryCard({ eyebrow, title, detail, tone = "neutral", children, className }) {
  return (
    <Card className={cn("mb-3 border-l-4 bg-card shadow-none", cardTone(tone), className)}>
      <CardContent className="p-4">
        {eyebrow && <div className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{eyebrow}</div>}
        {title && <div className={cn("text-xl font-extrabold leading-tight tracking-normal", textTone(tone))}>{title}</div>}
        {detail && <div className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</div>}
        {children && <div className="mt-3">{children}</div>}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, detail, tone = "neutral", icon, className, as: Comp = "div", ...props }) {
  return (
    <Comp
      className={cn(
        "rounded-lg border border-border bg-card p-3 text-left shadow-none",
        Comp === "button" && "w-full cursor-pointer transition-colors hover:bg-accent/60",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</div>
          <div className={cn("truncate text-base font-extrabold tracking-normal", textTone(tone))}>{value}</div>
        </div>
        {icon && <div className={cn("shrink-0", textTone(tone))}>{icon}</div>}
      </div>
      {detail && <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{detail}</div>}
    </Comp>
  );
}

function StatusCard({ children, tone = "neutral", className, as: Comp = "div", ...props }) {
  return (
    <Comp
      className={cn(
        "rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-none",
        cardTone(tone),
        Comp === "button" && "w-full cursor-pointer transition-colors hover:bg-accent/60",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

function InfoCard({ children, className, tone = "neutral" }) {
  return (
    <Card className={cn("border-border bg-card shadow-none", tone !== "neutral" && "border-l-4", cardTone(tone), className)}>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export { SummaryCard, MetricCard, StatusCard, InfoCard, textTone };
