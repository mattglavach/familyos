import { calculateRelationshipHealth, contactPatchForActivity, CONVERSATION_DEFAULTS, listFromText, recommendationsForRelationships, relationshipWeeklySummary } from "./relationshipHealth";

const person = { id: "r1", name: "Aubrey", priority: "High", status: "Active", birthday: "2010-07-20", last_contact_date: "2026-07-01", last_one_on_one_activity: "2026-06-20", activity_ideas: ["Ice Cream"] };

test("uses transparent priority thresholds for relationship health", () => {
  const health = calculateRelationshipHealth(person, [], [], "2026-07-14");
  expect(health.label).toBe("Needs Attention");
  expect(health.threshold).toBe(7);
  expect(health.reasons[0]).toContain("13 days since contact");
});

test("marks recent active relationships excellent", () => {
  const activities = [{ relationship_id: "r1", status: "completed", occurred_at: "2026-07-13T18:00:00Z" }];
  const health = calculateRelationshipHealth({ ...person, last_contact_date: "2026-07-13" }, activities, [], "2026-07-14");
  expect(health.label).toBe("Excellent");
  expect(health.recentActivities).toBe(1);
});

test("produces ranked nonduplicative relationship focus recommendations", () => {
  const items = recommendationsForRelationships([person], [], [], { today: "2026-07-14", existingRecommendations: [{ entity_id: "different", title: "Other" }] });
  expect(items).toHaveLength(3);
  expect(items[0].priority).toBe("High");
  expect(new Set(items.map(item => item.id)).size).toBe(items.length);
  expect(recommendationsForRelationships([person], [], [], { today: "2026-07-14", existingRecommendations: [{ entity_id: "r1" }] })).toHaveLength(0);
});

test("builds weekly summary and supports editable defaults", () => {
  const activities = [{ relationship_id: "r1", status: "completed", occurred_at: "2026-07-13T18:00:00Z", title: "Ice cream with Aubrey" }];
  const summary = relationshipWeeklySummary([person], activities, { today: "2026-07-14" });
  expect(summary.wins).toEqual(["Ice cream with Aubrey"]);
  expect(summary.birthdays[0].relationship.name).toBe("Aubrey");
  expect(CONVERSATION_DEFAULTS.teen).toContain("Future goals");
  expect(listFromText("Coffee\nWalk, Museum")).toEqual(["Coffee", "Walk", "Museum"]);
});

test("quick logs update the correct transparent contact fields", () => {
  expect(contactPatchForActivity("Phone Call", "2026-07-14")).toEqual({ last_contact_date: "2026-07-14", last_conversation: "2026-07-14" });
  expect(contactPatchForActivity("Date Night", "2026-07-14")).toEqual({ last_contact_date: "2026-07-14", last_one_on_one_activity: "2026-07-14" });
  expect(contactPatchForActivity("Visit", "2026-07-14")).toEqual({ last_contact_date: "2026-07-14" });
});
