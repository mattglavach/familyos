import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function ExpandableSection({ title, preferenceKey, defaultExpanded = false, children, className = "" }) {
  const [expanded, setExpanded] = useState(() => {
    if (!preferenceKey || typeof window === "undefined") return defaultExpanded;
    const saved = window.localStorage.getItem(preferenceKey);
    return saved == null ? defaultExpanded : saved === "true";
  });

  useEffect(() => {
    if (preferenceKey) window.localStorage.setItem(preferenceKey, String(expanded));
  }, [expanded, preferenceKey]);

  return (
    <section className={`rounded-lg border border-border bg-card ${className}`}>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-extrabold text-foreground"
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {expanded && <div className="border-t border-border px-4 py-3">{children}</div>}
    </section>
  );
}
