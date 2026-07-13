export const HABIT_CATEGORIES = ["Health","Exercise","Family","Faith","Personal","Morning","Evening","Kids","Home","Pool","Garden","Other"];

export function habitCategory(value) {
  return HABIT_CATEGORIES.includes(value) ? value : "Other";
}

export function isHabitDueToday(habit, date = new Date()) {
  if (!habit || habit.archived || habit.status !== "active") return false;
  if (habit.start_date && habit.start_date > date.toISOString().slice(0, 10)) return false;
  return !(habit.active_days || []).length || habit.active_days.includes(date.getDay());
}

export function completionState(status, progress) {
  if (status === "skipped") return "Skipped";
  if (status === "not_applicable") return "Not applicable";
  if (!progress?.total) return "No steps";
  if (progress.met) return "Complete";
  return progress.completed ? "In Progress" : "Not Started";
}

