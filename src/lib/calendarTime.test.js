import { FAMILYOS_TIME_ZONE, formatCalendarEventDateTime, formatCalendarEventTime, normalizeCalendarEvent, normalizeCalendarEventTime } from "./calendarTime";

describe("FamilyOS Calendar timezone contract", () => {
  test("uses America/New_York", () => expect(FAMILYOS_TIME_ZONE).toBe("America/New_York"));
  test.each([
    ["standard time", "2026-01-15T14:00:00Z", "9:00 AM"],
    ["daylight time", "2026-07-15T13:00:00Z", "9:00 AM"],
  ])("converts UTC during %s", (_label, value, expected) => {
    expect(normalizeCalendarEventTime({ dateTime: value, timeZone: "UTC" })).toMatchObject({ date: value.slice(0, 10), time: expected, allDay: false });
  });
  test("preserves all-day dates without timestamp parsing", () => {
    expect(normalizeCalendarEventTime({ date: "2026-07-04" })).toMatchObject({ date: "2026-07-04", time: "All day", allDay: true });
  });
  test("groups a UTC event by its New York calendar day", () => {
    expect(normalizeCalendarEventTime({ dateTime: "2026-07-16T02:00:00Z" }).date).toBe("2026-07-15");
  });
  test("preserves recurring occurrence offsets and provider timezone metadata", () => {
    expect(normalizeCalendarEventTime({ dateTime: "2026-11-05T09:00:00-05:00", timeZone: "America/New_York" })).toMatchObject({ time: "9:00 AM", sourceTimeZone: "America/New_York" });
  });

  test.each([
    ["July provider offset", "2026-07-11T14:00:00-04:00", "2:00 PM", "2026-07-11"],
    ["January provider offset", "2026-01-11T14:00:00-05:00", "2:00 PM", "2026-01-11"],
    ["July UTC instant", "2026-07-11T18:00:00Z", "2:00 PM", "2026-07-11"],
    ["near midnight before Eastern date boundary", "2026-07-12T03:30:00Z", "11:30 PM", "2026-07-11"],
    ["crosses into next Eastern date", "2026-07-12T04:30:00Z", "12:30 AM", "2026-07-12"],
  ])("formats non-recurring timed event: %s", (_label, start, time, date) => {
    const event = normalizeCalendarEvent({ start, time: "6:00 PM", sourceTimeZone: "America/New_York" });
    expect(event).toMatchObject({ start, providerStart: start, date, time, allDay: false });
    expect(formatCalendarEventTime(event)).toBe(time);
    expect(formatCalendarEventTime(event)).not.toBe("6:00 PM");
  });

  test.each([
    ["summer occurrence", "2026-07-11T14:00:00-04:00", "2:00 PM"],
    ["winter occurrence", "2026-01-11T14:00:00-05:00", "2:00 PM"],
    ["UTC occurrence", "2026-07-11T18:00:00Z", "2:00 PM"],
    ["before DST transition", "2026-03-07T14:00:00-05:00", "2:00 PM"],
    ["after DST transition", "2026-03-09T14:00:00-04:00", "2:00 PM"],
  ])("formats recurring event: %s", (_label, start, expected) => {
    const event = normalizeCalendarEvent({ id: "series_1", recurringEventId: "series", originalStartTime: { dateTime: start, timeZone: "America/New_York" }, start, sourceTimeZone: "America/New_York" });
    expect(formatCalendarEventTime(event)).toBe(expected);
    expect(event.originalStartTime.dateTime).toBe(start);
  });

  test("preserves a rescheduled occurrence instant and original start metadata", () => {
    const event = normalizeCalendarEvent({ start: "2026-07-11T15:30:00-04:00", originalStartTime: { dateTime: "2026-07-11T14:00:00-04:00", timeZone: "America/New_York" }, sourceTimeZone: "America/New_York" });
    expect(event.time).toBe("3:30 PM");
    expect(event.originalStartTime.dateTime).toBe("2026-07-11T14:00:00-04:00");
  });

  test("preserves single-day and multi-day all-day dates without timestamp conversion", () => {
    const single = normalizeCalendarEvent({ start: "2026-07-04", end: "2026-07-05", allDay: true });
    const multiple = normalizeCalendarEvent({ start: "2026-07-04", end: "2026-07-07", allDay: true });
    expect(single).toMatchObject({ date: "2026-07-04", start: "2026-07-04", time: "All day", allDay: true });
    expect(multiple).toMatchObject({ date: "2026-07-04", start: "2026-07-04", end: "2026-07-07", allDay: true });
  });

  test("uses the canonical timezone for combined date-time rendering", () => {
    expect(formatCalendarEventDateTime({ start: "2026-07-11T18:00:00Z" })).toBe("Jul 11, 2:00 PM");
  });
});
