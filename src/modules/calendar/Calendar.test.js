import { eventMetaLine, formatSyncTime, normalizeEvent } from "./Calendar";
import { expandCalendarEventDays } from "../../lib/calendarTime";

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

test("connected Calendar status uses a compact Today sync label", () => {
  expect(formatSyncTime("2026-07-11T18:14:00Z", new Date("2026-07-11T20:00:00Z"))).toBe("Today 2:14 PM");
});
test("all-day Google end dates are exclusive",()=>{expect(expandCalendarEventDays({id:"one",start:{date:"2026-07-12"},end:{date:"2026-07-13"}},"2026-07-12","2026-07-18").map(x=>x.date)).toEqual(["2026-07-12"]);expect(expandCalendarEventDays({id:"stay",start:{date:"2026-07-07"},end:{date:"2026-07-09"}},"2026-07-07","2026-07-13").map(x=>x.date)).toEqual(["2026-07-07","2026-07-08"]);});
test("timed events span local days and clip to the visible week",()=>{const event={id:"timed",start:{dateTime:"2026-07-10T22:00:00-04:00"},end:{dateTime:"2026-07-13T08:00:00-04:00"}};expect(expandCalendarEventDays(event,"2026-07-11","2026-07-12").map(x=>x.date)).toEqual(["2026-07-11","2026-07-12"]);});
test("an event beginning before today is active today",()=>{const rows=expandCalendarEventDays({id:"active",start:{date:"2026-07-10"},end:{date:"2026-07-15"}},"2026-07-12","2026-07-18");expect(rows[0].date).toBe("2026-07-12");expect(rows[0].isActiveOccurrence).toBe(true);});
