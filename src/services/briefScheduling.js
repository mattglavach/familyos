export const BRIEF_TYPES = ["morning", "evening", "weekly"];
export const DEFAULT_BRIEF_SCHEDULES = {
  morning: { enabled: true, time: "07:00", days: [1,2,3,4,5,6,0] },
  evening: { enabled: true, time: "19:30", days: [1,2,3,4,5,6,0] },
  weekly: { enabled: true, time: "17:00", days: [0] },
};

export function scheduledPeriodKey(type, now = new Date()) {
  const local = new Date(now);
  const day = `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,"0")}-${String(local.getDate()).padStart(2,"0")}`;
  if (type !== "weekly") return day;
  const sunday = new Date(local); sunday.setDate(local.getDate() - local.getDay());
  return `${sunday.getFullYear()}-${String(sunday.getMonth()+1).padStart(2,"0")}-${String(sunday.getDate()).padStart(2,"0")}`;
}

export function isBriefDue(schedule, type, history = [], now = new Date(), graceHours = 36) {
  if (!schedule?.enabled || !schedule.days?.includes(now.getDay())) return false;
  const [hour, minute] = String(schedule.time || "00:00").split(":").map(Number);
  const dueAt = new Date(now); dueAt.setHours(hour || 0, minute || 0, 0, 0);
  const age = now.getTime() - dueAt.getTime();
  if (age < 0 || age > graceHours * 3600000) return false;
  const period = scheduledPeriodKey(type, now);
  return !history.some(item => item.brief_type === type && item.period_key === period && item.status === "generated");
}

export function dueBriefs(schedules, history, now = new Date()) {
  return BRIEF_TYPES.filter(type => isBriefDue(schedules[type], type, history, now));
}

export function briefLabel(type) {
  return type === "morning" ? "Morning Brief" : type === "evening" ? "Evening Review" : "Weekly Planning";
}
