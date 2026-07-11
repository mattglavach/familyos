import { buildHouseholdContext, HOUSEHOLD_CONTEXT_CONTRACT, HOUSEHOLD_CONTEXT_VERSION } from "./householdContextService";

const now = new Date("2026-07-11T04:30:00Z");

test("builds complete versioned household context while preserving date-only calendar values", () => {
  const context = buildHouseholdContext({ householdIdentifier: "h1", household: { id: "h1", name: "Family" }, timezone: "America/New_York", now, range: { start: "2026-07-11", end: "2026-07-18" }, tasks: [{ id: "t1", household_id: "h1", title: "Today", due_date: "2026-07-11", completed: false }], calendar: [{ id: "e1", household_id: "h1", title: "Birthday", start: { date: "2026-07-11" } }], maintenance: [], birthdays: [], reminders: [], poolContext: { contract: "familyos.pool-context", generatedAt: now.toISOString(), attentionItems: [] } });
  expect(context.contract).toBe(HOUSEHOLD_CONTEXT_CONTRACT);
  expect(context.version).toBe(HOUSEHOLD_CONTEXT_VERSION);
  expect(context.calendarSummary.today[0]).toMatchObject({ date: "2026-07-11", allDay: true });
  expect(context.taskSummary.dueToday).toHaveLength(1);
  expect(context.missingOrUnavailableSources).toContainEqual({ source: "gardening", state: "not-configured" });
});

test("handles empty, missing, stale, timezone, and household isolation states", () => {
  const context = buildHouseholdContext({ householdIdentifier: "h1", timezone: "Unsupported/Zone", now, tasksUpdatedAt: "2026-07-01T00:00:00Z", tasks: [{ id: "wrong", household_id: "h2", due_date: "2026-07-10" }] });
  expect(context.timezone).toBe("America/New_York");
  expect(context.taskSummary.open).toHaveLength(0);
  expect(context.sourceFreshness.tasks.state).toBe("stale");
  expect(context.moduleAvailability.calendar).toBe("unavailable");
  expect(context.poolSummary.state).toBe("unavailable");
});

test("orders multiple attention items deterministically", () => {
  const base = { householdIdentifier: "h1", now: new Date("2026-07-11T16:00:00Z"), tasks: [], calendar: [], maintenance: [] };
  const context = buildHouseholdContext({ ...base, attentionItems: [
    { sourceModule: "maintenance", type: "due", severity: "Medium", title: "B", deduplicationKey: "b" },
    { sourceModule: "pool", type: "retest", severity: "High", title: "A", deduplicationKey: "a" },
  ] });
  expect(context.attentionItems.map(item => item.deduplicationKey)).toEqual(["a", "b"]);
});

test("normalizes Dashboard Calendar context from the preserved provider instant", () => {
  const context = buildHouseholdContext({ householdIdentifier: "h1", now: new Date("2026-07-11T16:00:00Z"), tasks: [], maintenance: [], calendar: [{ id: "event", title: "Known event", start: "2026-07-11T18:00:00Z", time: "6:00 PM" }] });
  expect(context.calendarSummary.today[0]).toMatchObject({ date: "2026-07-11", time: "2:00 PM" });
  expect(context.attentionItems.find(item => item.sourceRecordIdentifier === "event")?.message).toBe("2:00 PM today");
});
