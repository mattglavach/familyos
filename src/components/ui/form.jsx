import { Check, Trash2 } from "lucide-react";
import { useId } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";

function FormGroup({ className, ...props }) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function FormRow({ className, ...props }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)} {...props} />;
}

function FormSection({ title, description, className, children, ...props }) {
  return (
    <section className={cn("space-y-3", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-sm font-extrabold text-foreground">{title}</h3>}
          {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function FormHelp({ className, ...props }) {
  return <p className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />;
}

function FormError({ className, ...props }) {
  return <p className={cn("text-sm font-semibold leading-5 text-destructive", className)} {...props} />;
}

function RequiredMark() {
  return <span className="text-destructive" aria-hidden="true">*</span>;
}

function FieldLabel({ htmlFor, label, required }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      <span>{label}</span>
      {required && <RequiredMark />}
    </Label>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  help,
  required = false,
  inputMode = "decimal",
  className,
  ...props
}) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <FormGroup className={className}>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <Input
        id={inputId}
        type="number"
        inputMode={inputMode}
        value={value ?? ""}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-error` : help ? `${inputId}-help` : undefined}
        onChange={event => onChange(event.target.value, event)}
        {...props}
      />
      {help && !error && <FormHelp id={`${inputId}-help`}>{help}</FormHelp>}
      {error && <FormError id={`${inputId}-error`}>{error}</FormError>}
    </FormGroup>
  );
}

function NotesField({ id, label = "Notes", value, onChange, error, help, rows = 3, className, ...props }) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <FormGroup className={className}>
      <FieldLabel htmlFor={inputId} label={label} />
      <Textarea
        id={inputId}
        rows={rows}
        value={value ?? ""}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-error` : help ? `${inputId}-help` : undefined}
        onChange={event => onChange(event.target.value, event)}
        {...props}
      />
      {help && !error && <FormHelp id={`${inputId}-help`}>{help}</FormHelp>}
      {error && <FormError id={`${inputId}-error`}>{error}</FormError>}
    </FormGroup>
  );
}

function ToggleField({ checked, label, description, onChange, disabled = false, className }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={Boolean(checked)}
      className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold text-secondary-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60", className)}
      onClick={() => onChange(!checked)}
    >
      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
        {checked && <Check size={14} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {description && <span className="mt-0.5 block text-xs font-normal leading-5 text-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}

function DateTimeField({ dateLabel = "Date", timeLabel = "Time", date, time, onDateChange, onTimeChange, required = false, dateError = "", timeError = "", className }) {
  return (
    <FormRow className={className}>
      <FormGroup>
        <FieldLabel htmlFor="form-date" label={dateLabel} required={required} />
        <Input id="form-date" type="date" value={date || ""} aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? "form-date-error" : undefined} onChange={event => onDateChange(event.target.value, event)} />
        {dateError && <FormError id="form-date-error">{dateError}</FormError>}
      </FormGroup>
      <FormGroup>
        <FieldLabel htmlFor="form-time" label={timeLabel} />
        <Input id="form-time" type="time" value={time || ""} aria-invalid={Boolean(timeError) || undefined} aria-describedby={timeError ? "form-time-error" : undefined} onChange={event => onTimeChange(event.target.value, event)} />
        {timeError && <FormError id="form-time-error">{timeError}</FormError>}
      </FormGroup>
    </FormRow>
  );
}

function SaveCancelFooter({ saveLabel = "Save", cancelLabel = "Cancel", onSave, onCancel, submitting = false, disabled = false, children, className }) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>{cancelLabel}</Button>
      <Button type="button" onClick={onSave} disabled={disabled || submitting}>{submitting ? "Saving..." : saveLabel}</Button>
      {children}
    </div>
  );
}

function DeleteButton({ children = "Delete", onClick, disabled = false, className }) {
  return (
    <Button type="button" variant="destructive" onClick={onClick} disabled={disabled} className={className}>
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {children}
    </Button>
  );
}

function ValidationSummary({ error, errors, className }) {
  const messages = errors?.filter(Boolean) || (error ? [error] : []);
  if (!messages.length) return null;
  return (
    <div className={cn("rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm leading-5 text-destructive", className)} role="alert" tabIndex={-1}>
      <div className="font-bold">Check the form</div>
      {messages.length === 1 ? <div className="mt-1">{messages[0]}</div> : (
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {messages.map(message => <li key={message}>{message}</li>)}
        </ul>
      )}
    </div>
  );
}

export { DateTimeField, DeleteButton, FormGroup, FormRow, FormSection, FormHelp, FormError, NotesField, NumberField, SaveCancelFooter, ToggleField, ValidationSummary };
