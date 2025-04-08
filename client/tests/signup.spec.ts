import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "Test User";
const email = "test@test.com";
const company = "Test Company";

test("should show a success message on sign up to the waitlist", async ({
  page,
}) => {
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