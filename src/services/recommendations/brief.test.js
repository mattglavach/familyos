import { applySuppression, buildCrossModuleRecommendations, buildFamilyBrief, snoozeUntil } from "./brief";

const recommendation = (overrides = {}) => ({ id: "r1", deduplicationKey: "r1", triggerSignature: "v1", title: "Review the plan", severity: "high", urgency: "immediate", supportingData: [], ...overrides });

test("suppresses completed, matching dismissals, and active snoozes", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  expect(applySuppression([recommendation()], [{ recommendation_key: "r1", action: "completed", created_at: "2026-07-15T10:00:00Z" }], now)).toHaveLength(0);
  expect(applySuppression([recommendation()], [{ recommendation_key: "r1", action: "dismissed", trigger_signature: "v1", created_at: "2026-07-15T10:00:00Z" }], now)).toHaveLength(0);
  expect(applySuppression([recommendation()], [{ recommendation_key: "r1", action: "dismissed", trigger_signature: "v2", created_at: "2026-07-15T10:00:00Z" }], now)).toHaveLength(1);
  expect(applySuppression([recommendation()], [{ recommendation_key: "r1", action: "snoozed", remind_after: "2026-07-16T12:00:00Z", created_at: "2026-07-15T10:00:00Z" }], now)).toHaveLength(0);
});

test("creates contextual travel and weather recommendations without duplicates", () => {
  const results = buildCrossModuleRecommendations({
    events: [{ id: "trip", summary: "Denver trip", date: "2026-07-17" }, { id: "game", summary: "Outdoor game", date: "2026-07-15" }],
    tasks: [{ id: "pack", title: "Pack for trip", due_date: "2026-07-16" }],
    weather: { precipitationProbability: 80 },
  }, "2026-07-15");
  expect(results).toHaveLength(2);
  expect(results[0]).toMatchObject({ sourceModules: ["calendar", "tasks"], severity: "high" });
  expect(results[1]).toMatchObject({ sourceModules: ["weather", "calendar"] });
  expect(new Set(results.map(item => item.deduplicationKey)).size).toBe(results.length);
});

test("builds concise nonduplicative brief sections and separates safe-to-wait items", () => {
  const urgent = recommendation();
  const flexible = recommendation({ id: "r2", deduplicationKey: "r2", title: "Optional review", severity: "low", urgency: "when practical" });
  const brief = buildFamilyBrief({ recommendations: [urgent, flexible], today: "2026-07-15", data: { tasks: [{ id: "done", title: "Pay bill", completed: true, completed_at: "2026-07-15" }] } });
  expect(brief.today).toEqual([urgent]);
  expect(brief.nextActions).toEqual([flexible]);
  expect(brief.canWait[0].waitReason).toMatch(/No immediate safety/);
  expect(brief.wins).toEqual(["Completed Pay bill"]);
});

test("snooze presets produce future reminder times", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  expect(new Date(snoozeUntil("tomorrow", now)) > now).toBe(true);
  expect(new Date(snoozeUntil("weekend", now)).getDay()).toBe(6);
});
