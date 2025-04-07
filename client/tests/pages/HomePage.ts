import { Locator, Page, expect } from "playwright/test";

export class HomePage {
  readonly page: Page;
  readonly title: Locator;
  readonly waitListButton: Locator;
  readonly fullName: Locator;
  readonly email: Locator;
  readonly company: Locator;
  readonly submitButton: Locator;
  readonly toastMessage: Locator;
  readonly toastMessageDismiss: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = this.page.locator("h1");
    this.waitListButton = this.page.getByRole("button", {
      name: "Join the Waitlist",
    });
    this.fullName = this.page.getByRole("textbox", { name: "Full Name" });
    this.email = this.page.getByRole("textbox", { name: "Email Address" });
    this.company = this.page.getByRole("textbox", {
      name: "Company (Optional)",
    });
    this.submitButton = this.page
      .locator("#waitlist")
      .getByRole("button", { name: "Join Waitlist" });
    this.toastMessage = this.page
      .getByRole("region", { name: "Notifications (F8)" })
      .getByRole("status");
    this.toastMessageDismiss = this.page
      .getByRole("region", { name: "Notifications (F8)" })
      .getByRole("button");
  }

  async clickWaitListButton() {
    await this.waitListButton.click();
  }

  async fillOutWaitListForm(full_name: string, email: string, company: string) {
    await this.fullName.fill(full_name);
    await this.email.fill(email);
    await this.company.fill(company);
    await this.submitButton.click();
  }

  async assertToastMessage(expectedMessage: string) {
    await expect(this.toastMessage).toContainText(expectedMessage);
    await this.toastMessageDismiss.click();
    await expect(this.toastMessage).not.toBeVisible();
  }
}
