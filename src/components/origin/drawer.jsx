import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export function OriginDrawer({ open, onOpenChange, title, description, children, footer, className }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85"
      onClick={(event) => event.target === event.currentTarget && onOpenChange?.(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "origin-drawer-title" : undefined}
        className={cn(
          "max-h-[93vh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl border border-border bg-card px-5 pb-12 pt-3 text-card-foreground shadow-soft animate-in slide-in-from-bottom-4",
          className
        )}
      >
        <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-secondary" />
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 id="origin-drawer-title" className="text-xl font-bold leading-tight tracking-normal">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
          </div>
          <Button type="button" variant="secondary" size="icon-sm" aria-label="Close" onClick={() => onOpenChange?.(false)}>
            <X aria-hidden="true" />
          </Button>
        </header>
        <div>{children}</div>
        {footer && <footer className="mt-5 flex justify-end gap-2">{footer}</footer>}
      </section>
    </div>
  );
}
