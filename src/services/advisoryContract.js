export const ADVISORY_CONTRACT = "familyos.advisory-response";
export const ADVISORY_VERSION = "3.2";
export const PRIORITIES = ["critical", "high", "medium", "low"];
export const ACTION_TYPES = ["create_task", "update_task_due_date", "assign_task", "create_calendar_event", "suggest_calendar_block", "create_maintenance_item", "log_relationship_activity", "create_relationship_goal", "create_habit", "add_note", "add_pool_test_recommendation", "dismiss_recommendation", "mark_recommendation_completed"];

const text = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const strings = value => Array.isArray(value) ? value.filter(item => typeof item === "string").slice(0, 12) : [];

export function validateAdvisoryResponse(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Response must be an object."], fallbackSummary: "The advisory response was unavailable." };
  if (value.contract && value.contract !== ADVISORY_CONTRACT) errors.push("Unsupported response contract.");
  const normalizeItem = (item, index, kind) => {
    if (!item || typeof item !== "object") { errors.push(`${kind} ${index + 1} is invalid.`); return null; }
    const title = text(item.title);
    if (!title) { errors.push(`${kind} ${index + 1} needs a title.`); return null; }
    return { id: text(item.id, `${kind}-${index}`), title, explanation: text(item.explanation || item.reason), priority: PRIORITIES.includes(item.priority) ? item.priority : "medium", sourceModule: text(item.sourceModule, "household"), relatedRecordIds: strings(item.relatedRecordIds), evidenceLevel: ["confirmed", "calculated", "suggested"].includes(item.evidenceLevel) ? item.evidenceLevel : "suggested", ...item };
  };
  const recommendations = (Array.isArray(value.recommendations) ? value.recommendations : []).map((item, index) => normalizeItem(item, index, "recommendation")).filter(Boolean).map(item => {
    const action = item.proposedAction;
    if (!action) return { ...item, approvalRequired: true };
    if (!ACTION_TYPES.includes(action.type) || !action.payload || typeof action.payload !== "object") {
      errors.push(`Recommendation ${item.id} contains an unsafe action.`);
      const { proposedAction, ...safe } = item;
      return { ...safe, approvalRequired: true };
    }
    return { ...item, proposedAction: { type: action.type, payload: action.payload }, approvalRequired: true };
  });
  const normalized = { contract: ADVISORY_CONTRACT, version: ADVISORY_VERSION, summary: text(value.summary, "FamilyOS prepared a deterministic household summary."), findings: (Array.isArray(value.findings) ? value.findings : []).map((item, index) => normalizeItem(item, index, "finding")).filter(Boolean), recommendations, risks: (Array.isArray(value.risks) ? value.risks : []).map((item, index) => normalizeItem(item, index, "risk")).filter(Boolean), supportingRecords: Array.isArray(value.supportingRecords) ? value.supportingRecords.slice(0, 30) : [], sourceModules: strings(value.sourceModules), generatedAt: text(value.generatedAt, new Date().toISOString()), fallback: Boolean(value.fallback), usage: value.usage && typeof value.usage === "object" ? value.usage : null };
  return { ok: errors.length === 0, errors, value: normalized, fallbackSummary: normalized.summary };
}

export function deterministicAdvisory(context = {}, options = {}) {
  const modules = context.modules || {};
  const important = Object.entries(modules).flatMap(([sourceModule, module]) => (module.importantItems || []).map((item, index) => ({ id: `${sourceModule}-${index}`, title: item.title || item.action || `${sourceModule} needs attention`, explanation: item.reason || item.status || item.dueDate || "Review the supporting FamilyOS record.", priority: item.priority === "critical" ? "critical" : item.priority === "high" ? "high" : "medium", sourceModule, relatedRecordIds: item.id ? [String(item.id)] : [], evidenceLevel: "confirmed", approvalRequired: true })));
  const recommendations = Object.entries(modules).flatMap(([sourceModule, module]) => (module.recommendations || []).map((item, index) => ({ id: `${sourceModule}-recommendation-${index}`, title: item.action || item.title || `Review ${sourceModule}`, explanation: item.explanation || item.safetyNote || "Review this deterministic recommendation before acting.", priority: PRIORITIES.includes(item.priority) ? item.priority : "medium", sourceModule, relatedRecordIds: [], evidenceLevel: "calculated", approvalRequired: true }))).concat(important).slice(0, 8);
  return { contract: ADVISORY_CONTRACT, version: ADVISORY_VERSION, summary: recommendations.length ? `${recommendations.length} household item${recommendations.length === 1 ? " needs" : "s need"} review. Start with the highest-priority item.` : "No urgent household issues were found in the selected FamilyOS context.", findings: important.slice(0, 6), recommendations, risks: important.filter(item => ["critical", "high"].includes(item.priority)).slice(0, 4), supportingRecords: [], sourceModules: Object.keys(modules), generatedAt: new Date().toISOString(), fallback: options.fallback !== false };
}
