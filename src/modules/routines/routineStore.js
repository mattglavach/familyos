export function routinePeriodKey(routine, date = new Date()) {
  const local = new Date(date);
  const day = `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,"0")}-${String(local.getDate()).padStart(2,"0")}`;
  if (routine.recurrence === "weekly") {
    const monday = new Date(local); monday.setDate(local.getDate() - ((local.getDay()+6)%7));
    return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
  }
  return routine.recurrence === "once" ? "once" : day;
}
export function requiredStepsComplete(steps = [], completedStepIds = []) {
  return steps.filter(step => !step.optional).every(step => completedStepIds.includes(step.id));
}
export function toggleCompletedStep(ids = [], stepId) { return ids.includes(stepId) ? ids.filter(id => id !== stepId) : [...ids, stepId]; }
