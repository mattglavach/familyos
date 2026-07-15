import { buildCalendarSearchResult, buildRelationshipSearchResults } from "./GlobalSearch";

jest.mock("../../lib/supabase", () => ({ supabase: {} }));

test("Global Search formats preserved Calendar instants in Eastern time", () => {
  expect(buildCalendarSearchResult({ id: "1", title: "Known event", start: "2026-07-11T18:00:00Z", time: "6:00 PM" })).toMatchObject({ detail: "2026-07-11 2:00 PM", nav: { tab: "calendar", eventId: "1" } });
});

test("relationship search covers profile fields and excludes archived people", () => {
  const relationship = { id: "r1", name: "Aubrey", category: "Child", priority: "High", interests: ["Minecraft"], conversation_topics: ["School"], activity_ideas: ["Library"], notes: "Loves fantasy books", status: "Active" };
  for (const query of ["aubrey", "minecraft", "school", "library", "child", "fantasy"]) {
    expect(buildRelationshipSearchResults([relationship], query)[0].nav).toEqual({ tab: "relationships", relationshipId: "r1" });
  }
  expect(buildRelationshipSearchResults([{ ...relationship, status: "Archived" }], "aubrey")).toEqual([]);
});
