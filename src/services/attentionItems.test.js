import { createAttentionItem, normalizeAttentionItems } from "./attentionItems";

test("deduplicates, expires, isolates, and sorts attention items deterministically", () => {
  const now = new Date("2026-07-11T12:00:00Z");
  const items = normalizeAttentionItems([
    createAttentionItem({ householdIdentifier: "a", sourceModule: "tasks", sourceRecordId: "1", type: "due", severity: "Medium", title: "Due" }),
    createAttentionItem({ householdIdentifier: "a", sourceModule: "tasks", sourceRecordId: "1", type: "due", severity: "High", title: "Duplicate, higher severity" }),
    createAttentionItem({ householdIdentifier: "b", sourceModule: "tasks", sourceRecordId: "2", type: "due", severity: "Critical" }),
    createAttentionItem({ householdIdentifier: "a", sourceModule: "calendar", sourceRecordId: "3", type: "event", severity: "Informational", expirationDate: "2026-07-10" }),
  ], { householdIdentifier: "a", now });
  expect(items).toHaveLength(1);
  expect(items[0].severity).toBe("High");
  expect(items[0].title).toMatch(/Duplicate/);
});
