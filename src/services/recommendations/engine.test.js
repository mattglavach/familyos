import { generateRecommendations } from "./engine";

test("generates and ranks cross-module recommendations", () => {
  const recommendations = generateRecommendations({
    tasks: [{ id: "1", title: "Pay bill", due_date: "2026-07-11", is_important: true }],
    events: [{ id: "e1", summary: "Family dinner", date: "2026-07-12" }],
    shoppingItems: [{ id: "s1", name: "Milk", inventory_flag: true }],
  }, { today: "2026-07-12" });
  expect(recommendations[0]).toMatchObject({ id: "tasks-overdue", severity: "critical", category: "tasks" });
  expect(recommendations.map(item => item.id)).toEqual(expect.arrayContaining(["calendar-today"]));
  expect(recommendations.map(item => item.id)).not.toContain("shopping-needed");
});

test("supports provider registration and dismissed insights", () => {
  const provider = () => [{ id: "custom", severity: "low", category: "system", title: "Custom", recommendedAction: "Review", supportingData: [] }];
  expect(generateRecommendations({}, { providers: [provider] })).toHaveLength(1);
  expect(generateRecommendations({}, { providers: [provider], dismissedIds: ["custom"] })).toHaveLength(0);
});
