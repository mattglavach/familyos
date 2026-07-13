import {parseQuickAdd,resolveNaturalDate} from "./quickAddParser";
const now=new Date("2026-07-13T12:00:00-04:00");
test("resolves deterministic natural dates",()=>{expect(resolveNaturalDate("tomorrow",now)).toBe("2026-07-14");expect(resolveNaturalDate("in two weeks",now)).toBe("2026-07-27");expect(resolveNaturalDate("next month",now)).toBe("2026-08-01");});
test("parses calendar time and household member",()=>{const result=parseQuickAdd("Blake piano Tuesday at 5:30 PM",{now,members:[{id:"p1",name:"Blake"}],timezone:"America/New_York"});expect(result.module).toBe("calendar-event");expect(result.date).toBe("2026-07-14");expect(result.time).toBe("17:30");expect(result.memberId).toBe("p1");});
test("parses pool measurements",()=>{const result=parseQuickAdd("Pool chlorine 2.5 pH 7.8",{now});expect(result.module).toBe("pool");expect(result.measurements).toEqual({free_chlorine:2.5,ph:7.8});});
test("rejects shopping commands",()=>expect(parseQuickAdd("Buy milk tomorrow",{now})).toMatchObject({valid:false,excluded:true}));
