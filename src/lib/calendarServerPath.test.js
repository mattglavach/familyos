import { normalizeGoogleEvent } from "../../api/calendar";

describe("server Calendar synchronization normalization", () => {
  test("preserves provider instant and formats Eastern time", () => {
    const event = normalizeGoogleEvent({
      id: "event-1",
      summary: "Known event",
      start: { dateTime: "2026-07-11T14:00:00-04:00", timeZone: "America/New_York" },
      end: { dateTime: "2026-07-11T15:00:00-04:00", timeZone: "America/New_York" },
    }, 0, "Google Calendar");
    expect(event).toMatchObject({ start: "2026-07-11T14:00:00-04:00", providerStart: "2026-07-11T14:00:00-04:00", providerTimeZone: "America/New_York", date: "2026-07-11", time: "2:00 PM" });
  });

  test("normalizes recurring UTC occurrence and preserves recurrence metadata", () => {
    const event = normalizeGoogleEvent({
      id: "occurrence-1",
      recurringEventId: "series-1",
      originalStartTime: { dateTime: "2026-07-11T14:00:00-04:00", timeZone: "America/New_York" },
      start: { dateTime: "2026-07-11T18:00:00Z", timeZone: "UTC" },
      end: { dateTime: "2026-07-11T19:00:00Z", timeZone: "UTC" },
    }, 0, "Google Calendar");
    expect(event).toMatchObject({ recurringEventId: "series-1", time: "2:00 PM", sourceTimeZone: "UTC" });
    expect(event.originalStartTime.timeZone).toBe("America/New_York");
  });

  test("preserves all-day provider date", () => {
    expect(normalizeGoogleEvent({ id: "all-day", start: { date: "2026-07-04" }, end: { date: "2026-07-06" } }, 0, "Google Calendar")).toMatchObject({ date: "2026-07-04", start: "2026-07-04", end: "2026-07-06", allDay: true, time: "All day" });
  });
});
