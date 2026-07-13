import { upcomingEventDateLabel } from "./Dashboard";

test("upcoming events always include weekday and calendar date",()=>{
  expect(upcomingEventDateLabel({start:{dateTime:"2026-07-17T18:00:00-04:00"}},"2026-07-12")).toBe("Fri, Jul 17");
});

test("tomorrow label retains weekday and date",()=>{
  expect(upcomingEventDateLabel({start:{date:"2026-07-13"}},"2026-07-12")).toBe("Tomorrow · Mon, Jul 13");
});
