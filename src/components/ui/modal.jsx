import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";

function StandardModalLayout({ title, description, children, footer, className }) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && <div className="text-lg font-bold text-foreground">{title}</div>}
          {description && <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
      {footer && <div className="flex gap-2 pt-2">{footer}</div>}
    </div>
  );
}

function ConfirmDialog({ title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, destructive = false }) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="space-y-4 p-4">
        <div>
          <div className="text-base font-bold text-foreground">{title}</div>
          {description && <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant={destructive ? "destructive" : "default"} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ConfirmDialog, StandardModalLayout };
