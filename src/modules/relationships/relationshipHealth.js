const DAY_MS = 86400000;

export const RELATIONSHIP_CATEGORIES = ["Spouse", "Child", "Parent", "Family", "Friend", "Coworker", "Mentor", "Neighbor", "Other"];
export const RELATIONSHIP_PRIORITIES = ["High", "Medium", "Low"];
export const RELATIONSHIP_ACTIVITY_TYPES = ["Conversation", "Phone Call", "Date Night", "One-on-One", "Family Activity", "Meal Together", "Visit", "Custom"];
export const DEFAULT_ACTIVITY_IDEAS = ["Coffee", "Walk", "Ice Cream", "Pickleball", "Board Games", "Movie Night", "Fishing", "Lunch", "Shopping", "Road Trip", "Library", "Bike Ride", "Museum"];
export const CONVERSATION_DEFAULTS = {
  teen: ["Friends", "School", "College", "Driving", "Future goals", "Faith", "Stress"],
  "pre-teen": ["School", "Minecraft", "Sports", "Friends", "Books", "Hobbies"],
  adult: ["Family", "Career", "Vacations", "Health", "Shared interests"],
};

export function listFromText(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value || "").split(/[,\n]/).map(item => item.trim()).filter(Boolean);
}

export function daysSince(value, today = new Date().toISOString().slice(0, 10)) {
  if (!value) return null;
  const then = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  const now = new Date(`${today}T12:00:00`);
  if (Number.isNaN(then.getTime()) || Number.isNaN(now.getTime())) return null;
  return Math.max(0, Math.floor((now - then) / DAY_MS));
}

export function nextBirthday(birthday, today = new Date().toISOString().slice(0, 10)) {
  if (!birthday) return null;
  const parts = String(birthday).slice(0, 10).split("-");
  if (parts.length !== 3) return null;
  const current = new Date(`${today}T12:00:00`);
  let next = new Date(current.getFullYear(), Number(parts[1]) - 1, Number(parts[2]), 12);
  if (next < current) next = new Date(current.getFullYear() + 1, Number(parts[1]) - 1, Number(parts[2]), 12);
  return { date: next.toISOString().slice(0, 10), days: Math.round((next - current) / DAY_MS) };
}

export function contactThreshold(priority) {
  return priority === "High" ? 7 : priority === "Low" ? 30 : 14;
}

export function contactPatchForActivity(activityType, date) {
  const patch = { last_contact_date: date };
  if (["Conversation", "Phone Call"].includes(activityType)) patch.last_conversation = date;
  if (["Date Night", "One-on-One"].includes(activityType)) patch.last_one_on_one_activity = date;
  return patch;
}

export function calculateRelationshipHealth(relationship, activities = [], goals = [], today) {
  const completedActivities = activities.filter(item => item.relationship_id === relationship.id && item.status === "completed");
  const completedGoals = goals.filter(item => item.relationship_id === relationship.id && item.status === "completed").length;
  const activeGoals = goals.filter(item => item.relationship_id === relationship.id && item.status !== "archived").length;
  const days = daysSince(relationship.last_contact_date, today);
  const threshold = contactThreshold(relationship.priority);
  const recentActivities = completedActivities.filter(item => daysSince(item.occurred_at, today) <= threshold).length;
  const birthday = nextBirthday(relationship.birthday, today);
  let label = "Good";
  const reasons = [];
  if (days === null) {
    label = "Needs Attention";
    reasons.push("No contact has been logged");
  } else if (days > threshold) {
    label = "Needs Attention";
    reasons.push(`${days} days since contact exceeds the ${threshold}-day ${relationship.priority.toLowerCase()} priority guide`);
  } else if (days <= Math.max(3, Math.floor(threshold / 2)) && (recentActivities > 0 || completedGoals > 0)) {
    label = "Excellent";
    reasons.push(`Contact within ${days} day${days === 1 ? "" : "s"}`);
    if (recentActivities) reasons.push(`${recentActivities} recent activit${recentActivities === 1 ? "y" : "ies"}`);
  } else {
    reasons.push(`${days} days since contact is within the ${threshold}-day guide`);
  }
  if (activeGoals) reasons.push(`${completedGoals} of ${activeGoals} goals completed`);
  if (birthday?.days <= 14) reasons.push(`Birthday in ${birthday.days} day${birthday.days === 1 ? "" : "s"}`);
  return { label, daysSinceContact: days, threshold, recentActivities, completedGoals, activeGoals, reasons };
}

export function recommendationsForRelationships(relationships = [], activities = [], goals = [], options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const existingKeys = new Set((options.existingRecommendations || []).flatMap(item => [item.id, item.entity_id, String(item.title || "").toLowerCase()]));
  const rank = { High: 0, Medium: 1, Low: 2 };
  return relationships.filter(item => item.status === "Active").flatMap(relationship => {
    const health = calculateRelationshipHealth(relationship, activities, goals, today);
    const ideas = listFromText(relationship.activity_ideas);
    const birthday = nextBirthday(relationship.birthday, today);
    const candidates = [];
    if (health.label === "Needs Attention") candidates.push({
      id: `relationship-contact-${relationship.id}`,
      entity_id: relationship.id,
      title: health.daysSinceContact === null ? `Connect with ${relationship.name}` : `Reach out to ${relationship.name}`,
      detail: health.daysSinceContact === null ? "No contact logged yet" : `${health.daysSinceContact} days since contact`,
      priority: relationship.priority,
      nav: { tab: "relationships", relationshipId: relationship.id, action: "log" },
    });
    const oneOnOneDays = daysSince(relationship.last_one_on_one_activity, today);
    if (oneOnOneDays !== null && oneOnOneDays > health.threshold) candidates.push({
      id: `relationship-one-on-one-${relationship.id}`,
      entity_id: relationship.id,
      title: `Plan one-on-one time with ${relationship.name}`,
      detail: `${oneOnOneDays} days since one-on-one time${ideas[0] ? ` · Try ${ideas[0].toLowerCase()}` : ""}`,
      priority: relationship.priority,
      nav: { tab: "relationships", relationshipId: relationship.id, action: "plan" },
    });
    if (birthday?.days <= 14) candidates.push({
      id: `relationship-birthday-${relationship.id}-${birthday.date}`,
      entity_id: relationship.id,
      title: `${relationship.name}'s birthday is coming up`,
      detail: birthday.days === 0 ? "Today" : `In ${birthday.days} days`,
      priority: relationship.priority,
      nav: { tab: "relationships", relationshipId: relationship.id },
    });
    return candidates;
  }).filter(item => !existingKeys.has(item.id) && !existingKeys.has(item.entity_id) && !existingKeys.has(item.title.toLowerCase()))
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.detail.localeCompare(b.detail));
}

export function relationshipWeeklySummary(relationships = [], activities = [], options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(`${today}T12:00:00`); weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = activities.filter(item => item.status === "completed" && new Date(item.occurred_at) >= weekAgo);
  const names = Object.fromEntries(relationships.map(item => [item.id, item.name]));
  const recommendations = recommendationsForRelationships(relationships, activities, options.goals || [], { today });
  return {
    wins: recent.slice(0, 3).map(item => item.title || `${item.activity_type} with ${names[item.relationship_id] || "someone important"}`),
    reachOut: recommendations.filter(item => item.id.includes("contact")).slice(0, 3),
    birthdays: relationships.map(item => ({ relationship: item, birthday: nextBirthday(item.birthday, today) })).filter(item => item.birthday?.days <= 30).sort((a, b) => a.birthday.days - b.birthday.days),
    oneOnOne: recommendations.find(item => item.id.includes("one-on-one")) || null,
  };
}
