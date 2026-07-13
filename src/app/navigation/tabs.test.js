import { TABS } from "./tabs";

test("primary navigation is the core five-item workflow", () => {
  expect(TABS.map(tab=>tab.label)).toEqual(["Home","Habits","Calendar","Tasks","More"]);
  expect(TABS.some(tab=>tab.id==="quick-add")).toBe(false);
});
