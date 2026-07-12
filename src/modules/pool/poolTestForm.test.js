import { buildPoolReadingRow, validatePoolTestForm } from "./poolTestForm";

const valid = form => expect(validatePoolTestForm({ date: "2026-07-12", ...form }).valid).toBe(true);

test.each([
  ["FC, CC zero, and pH", { free_chlorine: "4", cc: "0", ph: "7.4" }],
  ["pH only", { ph: "7.4" }],
  ["salt, CYA, and temperature", { salt: "3400", cya: "70", water_temp: "82" }],
  ["complete test", { free_chlorine: "4", cc: "0", ph: "7.4", alkalinity: "90", cya: "70", calcium_hardness: "250", salt: "3400", water_temp: "82" }],
])("accepts %s", (_label, form) => valid(form));

test("rejects invalid numbers, ranges, dates, and times with field names", () => {
  expect(validatePoolTestForm({ date: "2026-02-30", ph: "7.4" }).fields).toEqual(["date"]);
  expect(validatePoolTestForm({ date: "2026-07-12", time: "25:00", ph: "7.4" }).fields).toEqual(["time"]);
  expect(validatePoolTestForm({ date: "2026-07-12", ph: "abc" }).fields).toEqual(["ph"]);
  expect(validatePoolTestForm({ date: "2026-07-12", ph: "10" }).fields).toEqual(["ph"]);
});

test("normalizes optional numeric and text fields while preserving zero", () => {
  const row = buildPoolReadingRow({ date: "2026-07-12", time: "12:30", cc: "0", ph: "", notes: "" });
  expect(row).toEqual(expect.objectContaining({ cc: 0, ph: null, notes: null, water_appearance: null, recent_weather_notes: null }));
});
