import { cn } from "../../lib/utils";
import { Button } from "./button";
import { SectionHeader } from "./section-header";

function DashboardSection({ title, count, action, tone = "neutral", children, className }) {
  return (
    <section className={cn("mt-4", className)}>
      <SectionHeader title={title} count={count} action={action} tone={tone} className="mb-2 mt-0" />
      {children}
    </section>
  );
}

function WidgetContainer({ title, subtitle, icon, status, actions, loading, empty, footer, children, className }) {
  if (loading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4 shadow-none", className)}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        </div>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4 shadow-none", className)}>
      {(title || subtitle || icon || status || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <div className="truncate text-sm font-bold text-foreground">{title}</div>}
            {subtitle && <div className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {status}
            {icon}
            {actions}
          </div>
        </div>
      )}
      {empty || children}
      {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
    </section>
  );
}

function ActionRow({ title, detail, indicator, action, onClick, className }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 border-b border-border py-2.5 text-left last:border-b-0",
        onClick && "cursor-pointer bg-transparent transition-colors hover:text-primary",
        className
      )}
    >
      {indicator && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: indicator }} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        {detail && <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>}
      </span>
      {action || (onClick && <span className="shrink-0 text-xs text-muted-foreground">&gt;</span>)}
    </Comp>
  );
}

function SectionAction({ children, ...props }) {
  return (
    <Button type="button" variant="link" size="xs" className="h-auto p-0 text-xs" {...props}>
      {children}
    </Button>
  );
}

export { DashboardSection, WidgetContainer, ActionRow, SectionAction };
