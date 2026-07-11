export const FAMILYOS_TIME_ZONE = "America/New_York";

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
