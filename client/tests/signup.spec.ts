import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "John Doe";
const email = "john.doe@example.com";
const company = "Acme Inc";

test("should sign up to the waitlist", async ({ page }) => {
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