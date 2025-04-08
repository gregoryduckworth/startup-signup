import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "Jane Doe";
const email = `janedoe${Math.random().toString(36).substring(7)}@example.com`;
const company = "Acme Corp";

test.describe("homepage", () => {
  test("should successfully sign up to the waitlist", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.clickWaitListButton();
    await homePage.fillOutWaitListForm(fullName, email, company);
    await homePage.assertToastMessage("Success");
  });
  
  test("should show an error on duplicate sign ups to the waitlist", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.clickWaitListButton();
    await homePage.fillOutWaitListForm(fullName, email, company);
    await homePage.assertToastMessage("Success");
    
    await homePage.clickWaitListButton();
    await homePage.fillOutWaitListForm(fullName, email, company);
    await homePage.assertToastMessage("Error409: {\"message\":\"Email already registered on the waitlist\"}");
  });
});