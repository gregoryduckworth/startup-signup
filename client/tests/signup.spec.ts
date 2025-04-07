async assertToastMessage(expectedMessage: string) {
  await this.page.waitForSelector('span[role="status"]');
  const toastMessageElement = this.page.locator('span[role="status"]');
  await expect(toastMessageElement).toContainText(expectedMessage);
}