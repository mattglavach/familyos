const { test, expect } = require("@playwright/test");
const { loginDemoUser, openMoreModule } = require("./helpers/app");

test("Release 2.5 brief, notification, and template workflows",async({page})=>{
 await loginDemoUser(page);
 await page.getByRole("button",{name:/Notifications/}).click();
 await page.getByText("Notification preferences",{exact:true}).click();
 await expect(page.getByLabel("Quiet hours start")).toBeVisible();
 await page.getByRole("button",{name:"Save notification preferences"}).click();
 await page.getByRole("button",{name:"Close",exact:true}).last().click();
 await openMoreModule(page,"AI Workspace");
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
