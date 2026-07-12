const DATE_PATTERN = /\b(20\d{2}-\d{2}-\d{2})\b/;

export const WORKFLOW_LABELS = {
  task: "Task",
  calendar: "Calendar event",
  pool: "Pool activity",
  life: "Life List item",
  finance: "Financial action",
};

export function suggestionPrefill(suggestion) {
  const text = String(suggestion?.text || "").trim();
  const date = text.match(DATE_PATTERN)?.[1] || "";
  const title = text.replace(DATE_PATTERN, "").replace(/\s{2,}/g, " ").replace(/[,.\s]+$/, "").trim();
  return { title: title || text, description: text, due_date: date, date };
}

export function workflowNavigation(suggestion) {
  const prefill = suggestionPrefill(suggestion);
  const common = { ts: Date.now(), guided: true, suggestionId: suggestion.id, prefill };
  if (suggestion.type === "task") return { tab: "tasks", workflow: "create", ...common };
  if (suggestion.type === "pool") return { tab: "pool", workflow: "note", ...common };
  if (suggestion.type === "life") return { tab: "life-lists", workflow: "item", ...common };
  if (suggestion.type === "finance") return { tab: "finance", workflow: "action", ...common };
  return null;
}

export function googleCalendarUrl(suggestion) {
  const { title, description, date } = suggestionPrefill(suggestion);
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, details: description });
  if (date) params.set("dates", `${date.replaceAll("-", "")}/${date.replaceAll("-", "")}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
