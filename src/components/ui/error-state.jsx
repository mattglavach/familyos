import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";

function ErrorState({ title = "Something went wrong", description = "FamilyOS could not load this content.", onRetry, network = false, className }) {
  const Icon = network ? WifiOff : AlertTriangle;
  return <Card className={cn("border-destructive/40", className)} role="alert">
    <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-foreground">{title}</div>
        <div className="mt-1 text-sm leading-5 text-muted-foreground">{description}</div>
      </div>
      {onRetry && <Button type="button" variant="secondary" onClick={onRetry}>Try again</Button>}
    </CardContent>
  </Card>;
}

export { ErrorState };
