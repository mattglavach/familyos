const normalize = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
export function recommendationKey(item = {}) { const records=item.relatedRecordIds||item.sourceIds||[];return item.deduplicationKey || [item.sourceModule || item.category,...records,...(records.length?[]:[item.condition||item.title])].map(normalize).filter(Boolean).join(":"); }
export function deduplicateRecommendations(items = [], state = [], options = {}) {
  const now = new Date(options.now || Date.now()), reminderMs = Number(options.reminderMs || 86400000 * 7), seen = new Set();
  const feedback = new Map((state || []).map(item => [item.recommendation_key, item]));
  return items.filter(item => { const key = recommendationKey(item); if (!key || seen.has(key)) return false; seen.add(key); const prior = feedback.get(key); if (!prior) return true; if (["completed", "dismissed"].includes(prior.status) && new Date(prior.remind_after || prior.updated_at || 0).getTime() + reminderMs > now.getTime()) return false; return true; });
}
