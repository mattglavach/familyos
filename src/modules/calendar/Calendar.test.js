import { calendarDisplayName, calendarInsights, eventMetaLine, formatSyncTime, groupEvents, groupWeekEventsByDay, normalizeEvent } from "./Calendar";
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
test("This Week events are grouped under dated day headings",()=>expect(Object.keys(groupWeekEventsByDay([{id:"a",date:"2026-07-13"},{id:"b",date:"2026-07-14"},{id:"c",date:"2026-07-14"}]))).toEqual(["2026-07-13","2026-07-14"]));
test("Calendar identifies conflicts and tight transitions",()=>{const flags=calendarInsights([{id:"a",start:"2026-07-12T10:00:00",end:"2026-07-12T11:00:00"},{id:"b",start:"2026-07-12T10:30:00",end:"2026-07-12T11:30:00"},{id:"c",start:"2026-07-12T11:45:00",end:"2026-07-12T12:00:00"}]);expect(flags.a.conflict).toBe(true);expect(flags.b.conflict).toBe(true);expect(flags.c.tight).toBe(true);});

test("synced event cards open Google Calendar while local events expand inline", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const open=jest.spyOn(window,"open").mockImplementation(()=>null);
  act(() => root.render(<Calendar deps={{ TODAY_STR: "2026-07-12", formatDateFull: value => value }} calendar={{ connected: true, status: "connected", events: [{ id: "event-1", title: "Piano lesson", start: { dateTime: "2026-07-12T14:00:00-04:00" }, end: { dateTime: "2026-07-12T15:00:00-04:00" }, location: "Music school", htmlLink: "https://calendar.google.com/event" },{id:"local-1",title:"Family planning",start:{dateTime:"2026-07-12T16:00:00-04:00"},end:{dateTime:"2026-07-12T17:00:00-04:00"},location:"Home"}] }} />));
  const button = [...container.querySelectorAll("button")].find(item => item.textContent.includes("Piano lesson"));
  act(() => Simulate.click(button));
  expect(open).toHaveBeenCalledWith("https://calendar.google.com/event","_blank","noopener,noreferrer");
  const localButton=[...container.querySelectorAll("button")].find(item=>item.textContent.includes("Family planning"));
  expect(localButton.getAttribute("aria-expanded")).toBe("false");
  act(()=>Simulate.click(localButton));
  expect(localButton.getAttribute("aria-expanded")).toBe("true");
  expect(container.textContent).toContain("Home");
  expect(container.textContent).not.toContain("No attendees listed");
  open.mockRestore();
  act(() => root.unmount());
  document.body.removeChild(container);
});

test("calendar display names omit syncing account email addresses",()=>{expect(calendarDisplayName("family@example.com")).toBe("");expect(calendarDisplayName("Family Calendar")).toBe("Family Calendar");});
