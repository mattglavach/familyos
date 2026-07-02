import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={(event) => event.target === event.currentTarget && onOpenChange?.(false)}>
      {children}
    </div>
  );
}

const DialogContent = React.forwardRef(({ className, children, onClose, titleId, ...props }, ref) => (
  <section
    ref={ref}
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    className={cn("relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 text-card-foreground shadow-soft", className)}
    {...props}
  >
    {onClose && (
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Close" className="absolute right-3 top-3" onClick={onClose}>
        <X aria-hidden="true" />
      </Button>
    )}
    {children}
  </section>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4 flex flex-col space-y-1.5 text-left", className)} {...props} />
));
DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
));
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-normal", className)} {...props}>
    {children}
  </h2>
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
