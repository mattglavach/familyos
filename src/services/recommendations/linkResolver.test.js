import { resolveRecommendationLink } from "./linkResolver";

test("resolves specific current targets", () => {
  expect(resolveRecommendationLink({category:"tasks",target:{type:"task",id:"t1",label:"Pay bill"}},{tasks:[{id:"t1"}]})).toEqual({tab:"tasks",taskId:"t1",search:"Pay bill"});
  expect(resolveRecommendationLink({category:"calendar",target:{type:"calendar-event",id:"e1"}},{events:[{id:"e1"}]})).toEqual({tab:"calendar",eventId:"e1"});
  expect(resolveRecommendationLink({category:"habits",target:{type:"habit",id:"h1"}},{habits:[{id:"h1"}]})).toEqual({tab:"habits",habitId:"h1"});
});

test("falls back safely for stale, deleted, or unavailable targets", () => {
  expect(resolveRecommendationLink({category:"habits",target:{type:"habit",id:"deleted"}},{habits:[]})).toEqual({tab:"habits"});
  expect(resolveRecommendationLink({category:"maintenance",target:{type:"home-asset",id:"unauthorized"}},{homeAssets:[]})).toEqual({tab:"home-assets"});
  expect(resolveRecommendationLink(null)).toEqual({tab:"home"});
});

