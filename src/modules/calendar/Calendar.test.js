import { eventMetaLine, formatSyncTime, groupEvents, normalizeEvent } from "./Calendar";
import { expandCalendarEventDays } from "../../lib/calendarTime";
import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { Calendar } from "./Calendar";

window.IS_REACT_ACT_ENVIRONMENT = true;

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
test("Today occurrences are excluded from This Week while tomorrow remains",()=>{const grouped=groupEvents([{id:"today",start:{date:"2026-07-12"},end:{date:"2026-07-13"}},{id:"tomorrow",start:{dateTime:"2026-07-13T09:00:00-04:00"},end:{dateTime:"2026-07-13T10:00:00-04:00"}}],"2026-07-12");expect(grouped.today.map(event=>event.id)).toEqual(["today"]);expect(grouped.thisWeek.map(event=>event.id)).toEqual(["tomorrow"]);});
test("recurring occurrence ids remain unique across Today and This Week",()=>{const grouped=groupEvents([{id:"series-20260712",recurringEventId:"series",start:{date:"2026-07-12"},end:{date:"2026-07-13"}},{id:"series-20260713",recurringEventId:"series",start:{date:"2026-07-13"},end:{date:"2026-07-14"}}],"2026-07-12");expect([...grouped.today,...grouped.thisWeek].map(event=>event.id)).toEqual(["series-20260712","series-20260713"]);});

test("event cards expand inline with ARIA state and omit empty details", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<Calendar deps={{ TODAY_STR: "2026-07-12", formatDateFull: value => value }} calendar={{ connected: true, status: "connected", events: [{ id: "event-1", title: "Piano lesson", start: { dateTime: "2026-07-12T14:00:00-04:00" }, end: { dateTime: "2026-07-12T15:00:00-04:00" }, location: "Music school", htmlLink: "https://calendar.google.com/event" }] }} />));
  const button = [...container.querySelectorAll("button")].find(item => item.textContent.includes("Piano lesson"));
  expect(button.getAttribute("aria-expanded")).toBe("false");
  act(() => Simulate.click(button));
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(container.textContent).toContain("Music school");
  expect(container.textContent).not.toContain("No attendees listed");
  expect(container.querySelector('a[href="https://calendar.google.com/event"]')).not.toBeNull();
  act(() => Simulate.click(button));
  expect(button.getAttribute("aria-expanded")).toBe("false");
  act(() => root.unmount());
  document.body.removeChild(container);
});
