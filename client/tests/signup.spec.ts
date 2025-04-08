import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "John Doe";
const email = "johndoe@example.com";
const company = "Acme Inc";
let homePage;

test.beforeEach(async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.clickWaitListButton();
});

test("should sign up to the waitlist", async () => {
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Success");
});

test("should show an error on duplicate sign ups to the waitlist", async () => {
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Error409: {\"message\":\"Email already registered on the waitlist\"}");
});