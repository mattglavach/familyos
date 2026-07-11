import { buildPoolContext, buildRetestStatuses, classifyTrend, evaluatePoolSafety, POOL_CONTEXT_VERSION, summarizeChlorineDemand, summarizePhRise } from "./domainService";

const now = new Date("2026-07-11T16:00:00Z");

test("blocks confident guidance from stale or incomplete tests", () => {
  const result = evaluatePoolSafety({ reading: { logged_at: "2026-07-07T12:00:00Z", free_chlorine: 5 }, now });
  expect(result.stale).toBe(true);
  expect(result.swimStatus).toBe("unknown");
  expect(result.warnings.join(" ")).toMatch(/stale.*Missing/i);
});

test("enforces acid and chlorine separation after recent treatment", () => {
  const result = evaluatePoolSafety({
    reading: { logged_at: "2026-07-11T15:00:00Z", free_chlorine: 5, ph: 7.5, cya: 70 },
    treatments: [{ logged_at: "2026-07-11T14:00:00Z", muriatic_acid_oz: 16 }], now,
  });
  expect(result.warnings).toContain("Do not add chlorine until the acid separation window has passed.");
});

test("builds scoped, task-linked Pool context", () => {
  const context = buildPoolContext({
    profile: { name: "Backyard Pool", volume_gallons: 17000 },
    readings: [{ logged_at: "2026-07-11T15:00:00Z", free_chlorine: 5, ph: 7.5, cya: 70 }],
    tasks: [{ id: "1", category: "Pool", completed: false }, { id: "2", category: "Home", completed: false }], now,
  });
  expect(context.contract).toBe("familyos.pool-context");
  expect(context.version).toBe(POOL_CONTEXT_VERSION);
  expect(context.openTasks).toHaveLength(1);
});

test("classifies observed, insufficient, stale, and irregular trends", () => {
  const rising = classifyTrend([
    { logged_at: "2026-07-11T12:00:00Z", ph: 7.8 }, { logged_at: "2026-07-10T12:00:00Z", ph: 7.5 }, { logged_at: "2026-07-06T12:00:00Z", ph: 7.2 },
  ], "ph", { now });
  expect(rising.state).toBe("rising");
  expect(rising.irregularIntervals).toBe(true);
  expect(classifyTrend([], "ph", { now }).state).toBe("insufficient-data");
  expect(classifyTrend([{ date: "2026-07-01", ph: 7.5 }, { date: "2026-06-30", ph: 7.4 }, { date: "2026-06-29", ph: 7.3 }], "ph", { now }).state).toBe("stale-data");
});

test("calculates chlorine demand only from untreated comparable intervals", () => {
  const summary = summarizeChlorineDemand({ readings: [
    { id: "2", logged_at: "2026-07-11T12:00:00Z", free_chlorine: 4 }, { id: "1", logged_at: "2026-07-10T12:00:00Z", free_chlorine: 6 },
  ], now });
  expect(summary).toMatchObject({ state: "observed", observedDailyFcDemand: 2 });
  const contaminated = summarizeChlorineDemand({ readings: [
    { logged_at: "2026-07-11T12:00:00Z", free_chlorine: 6 }, { logged_at: "2026-07-10T12:00:00Z", free_chlorine: 4 },
  ], treatments: [{ logged_at: "2026-07-11T00:00:00Z", liquid_chlorine_oz: 16 }], now });
  expect(contaminated.state).toBe("treatment-contaminated");
});

test("summarizes pH rise and treatment retest workflow", () => {
  const readings = [{ id: "after", logged_at: "2026-07-11T12:00:00Z", ph: 7.6 }, { id: "before", logged_at: "2026-07-10T10:00:00Z", ph: 7.2 }];
  const treatments = [{ id: "acid", logged_at: "2026-07-10T12:00:00Z", muriatic_acid_oz: 10, retest_at: "2026-07-11T10:00:00Z" }];
  expect(summarizePhRise({ readings, treatments, now }).state).toBe("observed");
  expect(buildRetestStatuses(treatments, readings, now)[0]).toMatchObject({ status: "completed", retestReadingId: "after" });
  expect(buildRetestStatuses([{ id: "pending", logged_at: "2026-07-10T12:00:00Z", liquid_chlorine_oz: 10, retest_at: "2026-07-11T10:00:00Z" }], [], now)[0].status).toBe("overdue");
});
