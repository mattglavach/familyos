import { buildPoolContext, evaluatePoolSafety } from "./domainService";

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
  expect(context.openTasks).toHaveLength(1);
});
