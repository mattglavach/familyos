import { cn } from "../../lib/utils";

function SegmentedControl({ value, onValueChange, options, className, itemClassName, ariaLabel }) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border bg-card p-1", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const selected = optionValue === value;

        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "min-h-8 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              selected && "bg-primary text-primary-foreground shadow-sm hover:text-primary-foreground",
              itemClassName
            )}
            onClick={() => onValueChange?.(optionValue)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ChipGroup({ value, onValueChange, options, className, allowDeselect = false, ariaLabel }) {
  const values = Array.isArray(value) ? value : [value];

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const disabled = typeof option === "string" ? false : option.disabled || option.supported === false;
        const selected = values.includes(optionValue);

        return (
          <button
            key={optionValue ?? "none"}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            className={cn(
              "min-h-8 rounded-full border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
              selected && "border-primary bg-primary/15 text-primary",
              disabled && "hover:border-border hover:text-muted-foreground"
            )}
            onClick={() => onValueChange?.(allowDeselect && selected ? null : optionValue)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl, ChipGroup };
