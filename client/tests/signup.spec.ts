import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "John Doe";
const email = "john@example.com";
const company = "Example Inc.";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
});

test.afterEach(async ({ request }) => {
  const response = await request.delete(
    `http://localhost:5000/api/waitlist/email/${email}`
  );
  if (!response.ok()) {
    console.error(
      `Failed to delete waitlist entry for ${email}:`,
      await response.text()
    );
  }
});

test("can sign up to the waitlist", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Success");
});

test("should show error when attempting to sign up to the waitlist again", async ({
  page,
}) => {
  const homePage = new HomePage(page);
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Success");
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Error");
});
