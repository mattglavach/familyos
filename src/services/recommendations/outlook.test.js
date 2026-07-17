import { buildMeaningfulChanges, buildSevenDayOutlook, workloadLevel } from "./outlook";

test("classifies seven-day pressure deterministically", () => {
  expect(workloadLevel(3)).toBe("light");
  const result = buildSevenDayOutlook({ events: [{ id: "a", date: "2026-07-16" }, { id: "b", date: "2026-07-16" }], tasks: [{ id: "t", due_date: "2026-07-16" }] }, "2026-07-16");
  expect(result[0]).toMatchObject({ level: "moderate", events: expect.any(Array), tasks: expect.any(Array) });
  expect(result).toHaveLength(7);
});

test("reports only records changed after the last visit", () => {
  const since = new Date("2026-07-15T08:00:00Z").getTime();
  expect(buildMeaningfulChanges({ tasks: [{ title: "Old", updated_at: "2026-07-15T07:00:00Z" }, { title: "Late", due_date: "2026-07-14", updated_at: "2026-07-15T09:00:00Z" }] }, since)).toEqual(["Task became overdue: Late"]);
});
