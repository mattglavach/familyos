import { completionState, habitCategory, isHabitDueToday } from "./habitConfig";

test("centralizes category, due, and routine state rules", () => {
  expect(habitCategory("Pool")).toBe("Pool");
  expect(habitCategory("Unknown")).toBe("Other");
  expect(isHabitDueToday({status:"active",active_days:[1]},new Date(2026,6,13,12))).toBe(true);
  expect(completionState("skipped",{total:3,completed:0})).toBe("Skipped");
  expect(completionState(null,{total:3,completed:1,met:false})).toBe("In Progress");
});
