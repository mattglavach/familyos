import { cn } from "../../lib/utils";

function FormGroup({ className, ...props }) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function FormRow({ className, ...props }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)} {...props} />;
}

function FormSection({ className, ...props }) {
  return <section className={cn("space-y-4", className)} {...props} />;
}

function FormHelp({ className, ...props }) {
  return <p className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />;
}

function FormError({ className, ...props }) {
  return <p className={cn("text-sm font-semibold leading-5 text-destructive", className)} {...props} />;
}

export { FormGroup, FormRow, FormSection, FormHelp, FormError };
