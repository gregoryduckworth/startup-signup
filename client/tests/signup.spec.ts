import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "Test User";
const email = `user${Math.floor(Math.random() * 10000)}@example.com`;
const company = "Test Company";

test.beforeEach(async ({ page }) => {
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