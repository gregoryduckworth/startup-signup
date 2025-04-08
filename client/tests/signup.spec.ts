import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

const fullName = "John Doe";
const email = `test${Math.random()}@gmail.com`;
const company = "Test Ltd";

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
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage('Error409: {"message":"Email already registered on the waitlist"}');
});