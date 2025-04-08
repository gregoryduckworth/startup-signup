import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "Test User";
const email = `user${Math.random().toString(36).substr(2, 5)}@example.com`; // Adding random string in email to make it unique
const company = "Test Company";

test("should join the waitlist successfully", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Success");
});

test("should show an error on duplicate sign ups to the waitlist", async ({
  page,
}) => {
  const homePage = new HomePage(page);
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Error409: {\"message\":\"Email already registered on the waitlist\"}");
});