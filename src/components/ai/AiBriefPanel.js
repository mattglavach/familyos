import { Button } from "../ui/button";
import { InfoCard } from "../ui/cards";
import { EmptyStatePanel } from "../ui/empty-state";
import { FormError, FormHelp } from "../ui/form";
import { Input } from "../ui/input";
import { LoadingCard } from "../ui/loading";
import { SectionHeader } from "../ui/section-header";

export function AiBriefText({ text, headingSize = "sm" }) {
  if (!text) return null;

  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-1.5" />;
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <div
          key={i}
          className={`mb-2 mt-4 font-bold uppercase tracking-[0.08em] text-primary ${headingSize === "md" ? "text-sm" : "text-xs"}`}
        >
          {trimmed.replace(/\*\*/g, "")}
        </div>
      );
    }
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <div key={i} className="relative mb-1.5 pl-3 text-sm leading-6 text-foreground">
          <span className="absolute left-0 text-primary">-</span>
          {trimmed.replace(/^[-*]\s*/, "")}
        </div>
      );
    }
    return (
      <div key={i} className="mb-1.5 text-sm leading-6 text-secondary-foreground">
        {trimmed}
      </div>
    );
  });
}

export function AiBriefCard({ children }) {
  return (
    <InfoCard className="mb-3 bg-secondary">
      {children}
    </InfoCard>
  );
}

export function AiBriefLoading({ title, detail }) {
  return (
    <div className="my-2">
      <LoadingCard className="bg-secondary/70">
        <div className="text-sm font-semibold text-muted-foreground">{title}</div>
        {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
      </LoadingCard>
    </div>
  );
}

export function AiBriefError({ children }) {
  if (!children) return null;
  return <FormError className="py-3">{children}</FormError>;
}

export function AiBriefEmpty({ detail, actionLabel, onAction }) {
  return <EmptyStatePanel title="No brief yet" detail={detail} action={actionLabel} onAction={onAction} className="py-8" />;
}

export function AiBriefActions({ primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div className="mb-4 flex gap-2">
      <Button type="button" className="flex-[2]" onClick={onPrimary}>
        {primaryLabel}
      </Button>
      {secondaryLabel && (
        <Button type="button" variant="secondary" className="flex-1" onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      )}
    </div>
  );
}

export function AiBriefFollowUp({ messages, asking, value, onChange, onAsk, placeholder }) {
  return (
    <>
      <SectionHeader title="Ask a follow-up" className="mb-2 mt-4" />
      {messages.map((message, i) => (
        <div key={i} className={`mb-2 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 text-foreground ${
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}
      {asking && <FormHelp className="mb-2">Thinking...</FormHelp>}
      <div className="flex gap-2">
        <Input
          className="h-10 flex-1"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={event => {
            if (event.key === "Enter") onAsk();
          }}
        />
        <Button type="button" variant="secondary" className="shrink-0" onClick={onAsk} disabled={asking}>
          Ask
        </Button>
      </div>
    </>
  );
}
