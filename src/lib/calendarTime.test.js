import { FAMILYOS_TIME_ZONE, normalizeCalendarEventTime } from "./calendarTime";

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
});
