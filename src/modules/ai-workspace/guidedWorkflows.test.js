import { googleCalendarUrl, suggestionPrefill, workflowNavigation } from "./guidedWorkflows";

test("guided suggestions produce prefilled owning-module navigation without writes", () => {
  const suggestion = { id: "task-1", type: "task", text: "Book annual physical 2026-07-20" };
  expect(suggestionPrefill(suggestion)).toMatchObject({ title: "Book annual physical", due_date: "2026-07-20" });
  expect(workflowNavigation(suggestion)).toMatchObject({ tab: "tasks", workflow: "create", guided: true });
});

test("calendar acceptance opens the existing Google Calendar form", () => {
  const url = googleCalendarUrl({ type: "calendar", text: "Dentist 2026-07-20" });
  expect(url).toContain("calendar.google.com/calendar/render");
  expect(url).toContain("action=TEMPLATE");
  expect(url).toContain("Dentist");
});
