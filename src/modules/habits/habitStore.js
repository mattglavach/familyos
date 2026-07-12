export const DEFAULT_HABITS = ["Exercise", "Faith", "Family Time", "Read", "Hydration", "Stretch", "Sleep Goal"];
export const HABIT_STORAGE_KEY = "familyos_habits_v1";

export function habitStorageKey(userId) { return `${HABIT_STORAGE_KEY}:${userId || "anonymous"}`; }

export function habitDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function readHabitState(userId, storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage) return {};
  try { return JSON.parse(storage.getItem(habitStorageKey(userId)) || "{}"); } catch { return {}; }
}

export function writeHabitState(userId, state, storage = typeof window !== "undefined" ? window.localStorage : null) {
  try { storage?.setItem(habitStorageKey(userId), JSON.stringify(state)); return true; } catch { return false; }
}

export function habitSummary(state, today = habitDateKey()) {
  const completed = DEFAULT_HABITS.filter(name => state[name]?.[today]).length;
  const week = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(`${today}T12:00:00`); date.setDate(date.getDate() - offset); return habitDateKey(date);
  });
  const completions = DEFAULT_HABITS.reduce((sum, name) => sum + week.filter(day => state[name]?.[day]).length, 0);
  return { completed, total: DEFAULT_HABITS.length, percent: Math.round((completions / (DEFAULT_HABITS.length * 7)) * 100) };
}
