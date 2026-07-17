import { buildRecommendationPipeline, recommendationNotification } from "./pipeline";

test("uses canonical identity and lifecycle suppression for every consumer", () => {
  const data = { tasks: [{ id: "task", title: "Pay bill", due_date: "2026-07-15", updated_at: "2026-07-15" }] };
  const first = buildRecommendationPipeline(data, { today: "2026-07-15", history: [] });
  const item = first.recommendations[0];
  expect(recommendationNotification(item).sourceKey).toBe(`recommendation:${item.deduplicationKey}`);
  const hidden = buildRecommendationPipeline(data, { today: "2026-07-15", history: [{ recommendation_key: item.deduplicationKey, action: "dismissed", trigger_signature: item.triggerSignature, created_at: "2026-07-15" }] });
  expect(hidden.recommendations).toHaveLength(0);
});
