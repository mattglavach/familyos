const todayReal = new Date();
todayReal.setHours(0, 0, 0, 0);

export const TODAY_DATE = todayReal;
export const TODAY_STR = todayReal.toISOString().split("T")[0];

export function daysBetween(s) {
  return Math.round((new Date(`${s}T00:00:00`) - todayReal) / (1000 * 60 * 60 * 24));
}

export function daysAgo(s) {
  return -daysBetween(s);
}

export function nextDueDate(last, interval) {
  const d = new Date(`${last}T00:00:00`);
  d.setDate(d.getDate() + interval);
  return d.toISOString().split("T")[0];
}

export function formatDate(s) {
  const value = String(s || "");
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateFull(s) {
  const value = String(s || "");
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatTodayShort() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
