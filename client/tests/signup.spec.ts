test("should show an error on duplicate sign ups to the waitlist", async ({
  page,
}) => {
  const homePage = new HomePage(page);
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Success");
  await homePage.clickWaitListButton();
  await homePage.fillOutWaitListForm(fullName, email, company);
  await homePage.assertToastMessage("Error409: {\"message\":\"Email already registered on the waitlist\"}");
});