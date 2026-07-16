const { test, expect } = require("@playwright/test");
const { loginDemoUser, monitorPage, openMoreModule } = require("./helpers/app");

test("Release 2.5 brief, notification, and template workflows",async({page})=>{
 await loginDemoUser(page);
 await page.getByRole("button",{name:/Notifications/}).click();
 await page.getByText("Notification preferences",{exact:true}).click();
 await expect(page.getByLabel("Quiet hours start")).toBeVisible();
 await expect(page.getByRole("button",{name:"Save notification preferences"})).toBeEnabled();
 const preferenceSave=page.waitForResponse(response=>["POST","PATCH"].includes(response.request().method())&&response.url().includes("/rest/v1/notification_preferences"));
 await page.getByRole("button",{name:"Save notification preferences"}).click();
 expect((await preferenceSave).ok()).toBe(true);
 await expect(page.getByRole("status")).toContainText("Notification preferences saved");
 await page.getByRole("button",{name:"Close",exact:true}).last().click();
 await openMoreModule(page,"Family Assistant");
 await expect(page.getByText("FamilyOS prepares due briefs when you open",{exact:false})).toBeVisible();
 await expect(page.getByLabel("Enable Morning Brief")).toBeVisible();
 await page.getByRole("button",{name:"Save brief schedule"}).click();
 await expect(page.getByRole("status")).toContainText("Brief schedule saved");
 await openMoreModule(page,"Routines");
 await page.getByRole("button",{name:/Templates/}).click();
 await expect(page.getByText("Morning routine",{exact:true})).toBeVisible();
 await page.getByText("Morning routine",{exact:true}).locator("..",).locator("..").getByRole("button",{name:"Preview"}).click();
 await expect(page.getByRole("button",{name:"Create routine"})).toBeVisible();
});

test("notification preference persistence failure stays controlled and can be retried",async({page})=>{
 const failures=monitorPage(page);
 await loginDemoUser(page);
 await page.getByRole("button",{name:/Notifications/}).click();
 await page.getByText("Notification preferences",{exact:true}).click();
 const saveButton=page.getByRole("button",{name:"Save notification preferences"});
 await expect(saveButton).toBeEnabled();
 let shouldFail=true;
 await page.route("**/rest/v1/notification_preferences*",async route=>{
   if(shouldFail&&["POST","PATCH"].includes(route.request().method())){
     shouldFail=false;
     await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"temporary persistence failure",code:"PGRST503"})});
   }else await route.continue();
 });
 await saveButton.click();
 await expect(page.getByRole("alert")).toContainText("could not be saved");
 await expect(page.locator("iframe#webpack-dev-server-client-overlay")).toHaveCount(0);
 await expect(page.getByLabel("Quiet hours start")).toBeEnabled();
 await saveButton.click();
 await expect(page.getByRole("status")).toContainText("Notification preferences saved");
 await page.getByRole("button",{name:"Close",exact:true}).last().click();
 await expect(page.getByRole("button",{name:/Notifications/})).toBeFocused();
 expect(failures.page).toEqual([]);
});
