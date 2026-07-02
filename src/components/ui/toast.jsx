import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2", className)} {...props} />
));
ToastViewport.displayName = "ToastViewport";

const Toast = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    aria-live="polite"
    className={cn(
      "rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground shadow-soft",
      variant === "destructive" && "border-destructive/35 bg-destructive/15 text-foreground",
      variant === "success" && "border-emerald-400/35 bg-emerald-400/15 text-foreground",
      className
    )}
    {...props}
  />
));
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("font-semibold", className)} {...props} />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
ToastDescription.displayName = "ToastDescription";

function ToastClose({ className, onClick }) {
  return (
    <Button type="button" variant="ghost" size="icon-xs" aria-label="Dismiss" className={className} onClick={onClick}>
      <X aria-hidden="true" />
    </Button>
  );
}

export { Toast, ToastViewport, ToastTitle, ToastDescription, ToastClose };
