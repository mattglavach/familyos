import { completionRate, habitGoalLabel, longestHabitStreak } from "./habitAnalytics";
const habit={id:"h",frequency:"weekly",target_count:3,active_days:[]};
test("describes count goals",()=>expect(habitGoalLabel(habit)).toBe("3 times per week"));
test("calculates completion rate and longest streak",()=>{const rows=["2026-07-10","2026-07-11","2026-07-12"].map(period_key=>({habit_id:"h",period_key,status:"completed"}));expect(completionRate(habit,rows,7,new Date(2026,6,12,12)).percent).toBe(43);expect(longestHabitStreak(habit,rows,new Date(2026,6,12,12))).toBe(3);});
