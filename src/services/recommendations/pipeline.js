import { applySuppression } from "./brief";
import { generateRecommendations } from "./engine";
import { enhanceRecommendations } from "./intelligence";

export function buildRecommendationPipeline(data = {}, options = {}) {
  const history = options.history || [];
  const generated = generateRecommendations(data, options);
  const visible = applySuppression(generated, history, options.now || new Date());
  return enhanceRecommendations(visible, { data, history, today: options.today, settings: options.settings });
}

export function recommendationNotification(item) {
  const key = item.deduplicationKey || item.id;
  return {
    id: `recommendation:${key}`,
    sourceKey: `recommendation:${key}`,
    recommendationKey: key,
    category: item.category,
    priority: item.priorityScore,
    kind: item.category,
    tone: ["critical", "high"].includes(item.severity) ? "urgent" : "warning",
    title: item.title,
    detail: `${item.recommendedAction} · ${item.whyNow || item.rationale}`,
    nav: item.nav,
  };
}
