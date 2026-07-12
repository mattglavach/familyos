export function isTaskComplete(task) { return Boolean(task.completed) || String(task.status || "").toLowerCase() === "completed"; }
export function isMyTask(task, { currentPersonId } = {}) {
  if (isTaskComplete(task)) return false;
  if (task.assigned_person_id) return Boolean(currentPersonId) && task.assigned_person_id === currentPersonId;
  if (Array.isArray(task.assigned_person_ids) && task.assigned_person_ids.length) return task.assigned_person_ids.includes(currentPersonId);
  return ["household", "family", "shared"].includes(String(task.visibility || task.assignment_scope || "household").toLowerCase());
}
export function localDateKey(value) {
  if (!value) return "";
  const text = String(value); if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text); if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function isDueTask(task, today) { return !isTaskComplete(task) && Boolean(task.due_date) && localDateKey(task.due_date) <= today; }
export function sortDueTasks(a,b) { return localDateKey(a.due_date).localeCompare(localDateKey(b.due_date)) || String(a.due_time || a.due_date || "23:59").localeCompare(String(b.due_time || b.due_date || "23:59")); }
