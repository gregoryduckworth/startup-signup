import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "John Doe";
const email = "john@example.com";
const company = "Example Inc.";

test.beforeEach(async ({ page, request }) => {
  await request.delete(`http://localhost:3000/api/waitlist/email/${email}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  await page.goto("http://localhost:3000");
});

test("can sign up to the waitlist", async ({ page }) => {
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
  await homePage.assertToastMessage("Success");
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Success");


// LLM suggested fix
/Users/gregduckworth/Github/startup-signup/client/tests/signup.spec.ts
});
