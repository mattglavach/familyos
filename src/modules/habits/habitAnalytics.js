import { habitDateKey } from "./habitStore";

const completed = (habit, rows, key) => rows.some(row => row.habit_id === habit.id && row.period_key === key && row.status === "completed");
export function habitGoalLabel(habit) {
  if ((habit.active_days || []).length === 5 && [1,2,3,4,5].every(day => habit.active_days.includes(day))) return "Every weekday";
  const target = Number(habit.target_count) || 1;
  return habit.frequency === "daily" ? "Daily" : `${target} time${target === 1 ? "" : "s"} per ${habit.frequency === "weekly" ? "week" : "month"}`;
}
export function completionRate(habit, rows, days, now = new Date()) {
  let due = 0, done = 0;
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(now); date.setHours(12,0,0,0); date.setDate(date.getDate() - offset);
    if ((habit.active_days || []).length && !habit.active_days.includes(date.getDay())) continue;
    due += 1; if (completed(habit, rows, habitDateKey(date))) done += 1;
  }
  return { done, due, percent: due ? Math.round(done / due * 100) : 0 };
}
export function longestHabitStreak(habit, rows, now = new Date()) {
  let longest = 0, current = 0;
  for (let offset = 365; offset >= 0; offset -= 1) {
    const date = new Date(now); date.setHours(12,0,0,0); date.setDate(date.getDate() - offset);
    if ((habit.active_days || []).length && !habit.active_days.includes(date.getDay())) continue;
    if (completed(habit, rows, habitDateKey(date))) { current += 1; longest = Math.max(longest, current); } else current = 0;
  }
  return longest;
}
export function recentHabitDays(habit, rows, count = 28, now = new Date()) {
  return Array.from({length:count},(_,index)=>{const date=new Date(now);date.setHours(12,0,0,0);date.setDate(date.getDate()-(count-index-1));const key=habitDateKey(date);return{key,completed:completed(habit,rows,key)};});
}
