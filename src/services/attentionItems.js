export const ATTENTION_SEVERITY = Object.freeze({ Critical: 0, High: 1, Medium: 2, Informational: 3 });

function isoDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}
export function createAttentionItem(input) {
  const sourceModule = input.sourceModule || "household";
  const type = input.type || "review";
  const sourceRecordId = input.sourceRecordId || null;
  const deduplicationKey = input.deduplicationKey || `${sourceModule}:${type}:${sourceRecordId || "general"}`;
  return {
    identifier: input.identifier || deduplicationKey,
    householdIdentifier: input.householdIdentifier || null,
    sourceModule,
    sourceRecordIdentifier: sourceRecordId,
    type,
    severity: ATTENTION_SEVERITY[input.severity] === undefined ? "Informational" : input.severity,
    title: input.title || "Review needed",
    message: input.message || "Open the source module for details.",
    createdDate: input.createdDate || new Date().toISOString(),
    relevantDate: isoDate(input.relevantDate),
    expirationDate: isoDate(input.expirationDate),
    acknowledged: Boolean(input.acknowledged),
    navigationDestination: input.navigationDestination || sourceModule,
    dataFreshness: input.dataFreshness || null,
    deduplicationKey,
  };
}

export function normalizeAttentionItems(items = [], { householdIdentifier = null, now = new Date() } = {}) {
  const today = now.toISOString().slice(0, 10);
  const unique = new Map();
  items.filter(Boolean).forEach(raw => {
    const item = createAttentionItem({ ...raw, householdIdentifier: raw.householdIdentifier || householdIdentifier });
    if (householdIdentifier && item.householdIdentifier !== householdIdentifier) return;
    if (item.expirationDate && item.expirationDate < today) return;
    const existing = unique.get(item.deduplicationKey);
    if (!existing || ATTENTION_SEVERITY[item.severity] < ATTENTION_SEVERITY[existing.severity]) unique.set(item.deduplicationKey, item);
  });
  return [...unique.values()].sort((a, b) =>
    ATTENTION_SEVERITY[a.severity] - ATTENTION_SEVERITY[b.severity]
    || String(a.relevantDate || "9999-12-31").localeCompare(String(b.relevantDate || "9999-12-31"))
    || a.deduplicationKey.localeCompare(b.deduplicationKey)
  );
}
