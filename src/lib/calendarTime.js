export const FAMILYOS_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: FAMILYOS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: FAMILYOS_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: FAMILYOS_TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function parts(value, formatter) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
}

/** Normalize a Google Calendar event without changing its provider timestamp semantics. */
export function normalizeCalendarEventTime(start = {}) {
  if (start.date && !start.dateTime) {
    return { start: start.date, date: start.date, time: "All day", allDay: true, sourceTimeZone: start.timeZone || "date-only" };
  }
  const value = start.dateTime || "";
  const dateParts = parts(value, dateFormatter);
  const timeParts = parts(value, timeFormatter);
  if (!dateParts || !timeParts) return { start: value, date: "", time: "", allDay: false, sourceTimeZone: start.timeZone || "" };
  return {
    start: value,
    date: `${dateParts.year}-${dateParts.month}-${dateParts.day}`,
    time: `${timeParts.hour}:${timeParts.minute} ${timeParts.dayPeriod}`,
    allDay: false,
    sourceTimeZone: start.timeZone || "",
  };
}

/** Normalize either a provider event or a FamilyOS event at every client boundary. */
export function normalizeCalendarEvent(event = {}) {
  const providerStart = event.providerStart || event.start;
  const start = providerStart && typeof providerStart === "object"
    ? providerStart
    : event.allDay
      ? { date: providerStart || event.date, timeZone: event.sourceTimeZone }
      : { dateTime: providerStart, timeZone: event.sourceTimeZone };
  const normalized = normalizeCalendarEventTime(start);
  if (!normalized.start) return { ...event, providerStart: providerStart || "" };
  return {
    ...event,
    ...normalized,
    providerStart: normalized.start,
    providerTimeZone: start.timeZone || event.providerTimeZone || event.sourceTimeZone || (normalized.allDay ? "date-only" : ""),
    providerEnd: event.providerEnd || event.end || null,
  };
}

function localDateKey(value) {
  if (!value) return "";
  if (typeof value === "object") return value.date || localDateKey(value.dateTime);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function plusDays(key, days) { const date=new Date(`${key}T12:00:00`); date.setDate(date.getDate()+days); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function expandCalendarEventDays(event, rangeStart, rangeEnd) {
  const normalized=normalizeCalendarEvent(event); const start=normalized.date; if(!start)return[];
  let end=localDateKey(normalized.providerEnd)||start;
  if(normalized.allDay&&end>start)end=plusDays(end,-1);
  const first=start<rangeStart?rangeStart:start; const last=end>rangeEnd?rangeEnd:end; if(first>last)return[];
  const days=[]; for(let day=first;day<=last;day=plusDays(day,1))days.push({...normalized,date:day,occurrenceDate:day,isMultiDay:start!==end,isActiveOccurrence:day>start,occurrenceKey:`${normalized.id||normalized.title||"event"}:${day}`});
  return days;
}

export function formatCalendarEventTime(event = {}) {
  const normalized = normalizeCalendarEvent(event);
  return normalized.allDay ? "All day" : normalized.time || "Time unavailable";
}

export function formatCalendarEventDateTime(event = {}) {
  const normalized = normalizeCalendarEvent(event);
  if (normalized.allDay) return normalized.date || "Date unavailable";
  const date = new Date(normalized.start);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateTimeFormatter.format(date);
}
