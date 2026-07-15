import { STARTER_PROMPTS } from "./AIWorkspace";

test("Family Assistant offers a concise set of practical starter prompts",()=>{
  expect(STARTER_PROMPTS).toHaveLength(7);
  expect(STARTER_PROMPTS).toEqual(expect.arrayContaining(["What needs attention today?","What should we prioritize this week?","Is the pool ready to swim in?"]));
});
