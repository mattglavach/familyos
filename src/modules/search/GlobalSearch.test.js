import { buildCalendarSearchResult } from "./GlobalSearch";

jest.mock("../../lib/supabase", () => ({ supabase: {} }));

test("Global Search formats preserved Calendar instants in Eastern time", () => {
  expect(buildCalendarSearchResult({ id: "1", title: "Known event", start: "2026-07-11T18:00:00Z", time: "6:00 PM" })).toMatchObject({ detail: "2026-07-11 2:00 PM", nav: { tab: "calendar", eventId: "1" } });
});
