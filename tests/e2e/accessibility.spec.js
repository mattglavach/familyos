const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { loginDemoUser, navigateModule, openMoreModule } = require("./helpers/app");

async function audit(page,label){const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();const critical=results.violations.filter(item=>item.impact==="critical");expect(critical,`${label} critical accessibility violations:\n${critical.map(item=>`${item.id}: ${item.help}`).join("\n")}`).toEqual([]);}

test("Release 2.5 representative authenticated accessibility audit",async({page})=>{
 await loginDemoUser(page); await audit(page,"Home");
 await page.getByRole("button",{name:/Notifications/}).click(); await expect(page.getByText("Notification preferences",{exact:true})).toBeVisible(); await audit(page,"Notifications"); await page.getByRole("button",{name:"Close",exact:true}).last().click();
 await page.getByRole("button",{name:"Open Calendar"}).click(); await audit(page,"Calendar");
 await openMoreModule(page,"Habits"); await audit(page,"Habits");
 await openMoreModule(page,"Routines"); await audit(page,"Routines"); await page.getByRole("button",{name:/Templates/}).click(); await audit(page,"Routine Templates");
 await page.keyboard.press("Control+K"); await audit(page,"Search"); await page.getByRole("button",{name:"Close"}).last().click();
 await openMoreModule(page,"Family Assistant"); await expect(page.getByText("Brief Scheduling")).toBeVisible(); await audit(page,"Brief configuration");
 await openMoreModule(page,"Relationships"); await audit(page,"Relationships");
 await page.keyboard.press("Tab"); await expect(page.locator(":focus")).toBeVisible();
});

test("keyboard, dialog focus, responsive zoom-equivalent, and recommendation accessibility",async({page})=>{
 await loginDemoUser(page);
 await page.getByRole("button",{name:"Add household item",exact:true}).focus();
 await expect(page.getByRole("button",{name:"Add household item",exact:true})).toBeFocused();
 await page.keyboard.press("Enter");
 const quickAdd=page.getByRole("dialog");
 await expect(quickAdd).toBeVisible();
 await expect(quickAdd.getByRole("button",{name:"Close",exact:true})).toBeFocused();
 await page.keyboard.press("Escape");
 await expect(quickAdd).toBeHidden();
 await expect(page.getByRole("button",{name:"Add household item",exact:true})).toBeFocused();

 for(const viewport of [{width:640,height:480},{width:1024,height:768},{width:1440,height:900}]){
  await page.setViewportSize(viewport);
  const layout=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(layout.scroll).toBeLessThanOrEqual(layout.client);
 }
 await audit(page,"Responsive recommendation Home");
});
