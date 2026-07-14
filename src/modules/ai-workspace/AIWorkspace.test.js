import { STARTER_PROMPTS } from "./AIWorkspace";

test("AI Workspace offers a concise set of practical starter prompts",()=>{
  expect(STARTER_PROMPTS).toHaveLength(7);
  expect(STARTER_PROMPTS).toEqual(expect.arrayContaining(["What needs attention this week?","Review our routines and suggest improvements."]));
});
