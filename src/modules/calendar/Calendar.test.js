import { eventMetaLine, normalizeEvent } from "./Calendar";

jest.mock("../../lib/supabase", () => ({ supabase: {} }));

test("Calendar card and detail paths ignore a malformed UTC clock display field", () => {
  const event = normalizeEvent({ id: "1", title: "Known event", start: "2026-07-11T18:00:00Z", time: "6:00 PM", sourceTimeZone: "UTC" }, 0, "Google Calendar");
  expect(event.time).toBe("2:00 PM");
  expect(eventMetaLine(event, "2026-07-11", value => value)).toBe("Today - 2:00 PM");
});

test("Calendar card and detail paths preserve all-day dates", () => {
  const event = normalizeEvent({ id: "2", start: "2026-07-04", end: "2026-07-06", allDay: true }, 0, "Google Calendar");
  expect(eventMetaLine(event, "2026-07-03", value => value)).toBe("Tomorrow - All day");
});
