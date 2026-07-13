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

test("surfaces only relevant incomplete habits with specific progress links", () => {
  const recommendations=generateRecommendations({habits:[{id:"h1",name:"Morning Routine",status:"active",active_days:[],habit_type:"checklist"},{id:"h2",name:"Done",status:"active",active_days:[]}],habitCompletions:[{habit_id:"h2",period_key:"2026-07-13",status:"completed"}],habitActions:[{id:"a1",habit_id:"h1",active:true},{id:"a2",habit_id:"h1",active:true}],habitActionHistory:[{habit_id:"h1",habit_date:"2026-07-13",completed_action_ids:["a1"]}]},{today:"2026-07-13"});
  expect(recommendations).toHaveLength(1);
  expect(recommendations[0]).toMatchObject({id:"habit-h1",title:"Morning Routine",recommendedAction:"1 of 2 complete. Finish today's routine.",target:{type:"habit",id:"h1"}});
});
