import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";

function ChartContainer({ title, subtitle, children, footer, className }) {
  return (
    <Card className={cn("bg-card shadow-none", className)}>
      <CardContent className="p-4">
        {(title || subtitle) && (
          <div className="mb-3">
            {title && <div className="text-sm font-bold text-foreground">{title}</div>}
            {subtitle && <div className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</div>}
          </div>
        )}
        <div className="min-h-40">{children}</div>
        {footer && <div className="mt-3 text-xs leading-5 text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export { ChartContainer };
