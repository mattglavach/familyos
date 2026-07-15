import { briefRecommendationAction, groupUpcomingEvents, upcomingEventDateLabel, upcomingEventGroupLabel } from "./Dashboard";

test("upcoming events always include weekday and calendar date",()=>{
  expect(upcomingEventDateLabel({start:{dateTime:"2026-07-17T18:00:00-04:00"}},"2026-07-12")).toBe("Fri, Jul 17");
});

test("groups a maximum of three upcoming events without empty groups",()=>{
  const events=[{id:"1",start:{date:"2026-07-12"}},{id:"2",start:{date:"2026-07-13"}},{id:"3",start:{date:"2026-07-15"}},{id:"4",start:{date:"2026-07-16"}}];
  expect(groupUpcomingEvents(events,"2026-07-12")).toEqual([{label:"Today",events:[events[0]]},{label:"Tomorrow",events:[events[1]]},{label:"Wednesday",events:[events[2]]}]);
  expect(upcomingEventGroupLabel(events[2],"2026-07-12")).toBe("Wednesday");
});

test("tomorrow label retains weekday and date",()=>{
  expect(upcomingEventDateLabel({start:{date:"2026-07-13"}},"2026-07-12")).toBe("Tomorrow · Mon, Jul 13");
});

test("removes the redundant overdue-task instruction from Family Brief cards",()=>{
  expect(briefRecommendationAction({recommendedAction:"Complete, delegate, or reschedule this overdue task."})).toBe("");
  expect(briefRecommendationAction({recommendedAction:"Due today"})).toBe("Due today");
});
