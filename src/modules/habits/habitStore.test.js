import { DEFAULT_HABITS, habitStorageKey, habitSummary, readHabitState, writeHabitState } from "./habitStore";

test("habitSummary reports today's and weekly completion", () => {
  const today = "2026-07-12";
  const state = { Exercise: { [today]: true }, Read: { [today]: true } };
  expect(habitSummary(state, today)).toEqual({ completed: 2, total: DEFAULT_HABITS.length, percent: 4 });
});

test("habit storage is isolated by authenticated user", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  writeHabitState("user-a", { Exercise: { "2026-07-12": true } }, storage);
  expect(readHabitState("user-a", storage).Exercise["2026-07-12"]).toBe(true);
  expect(readHabitState("user-b", storage)).toEqual({});
  expect(habitStorageKey("user-a")).not.toBe(habitStorageKey("user-b"));
});
