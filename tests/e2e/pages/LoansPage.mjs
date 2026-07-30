export class LoansPage {
  constructor(page) {
    this.page = page;
  }

  async approveIncomingRequest() {
    await this.page.click('button:has-text("Approve")');
    await this.page.waitForTimeout(1500);
  }

  async declineIncomingRequest() {
    await this.page.click('button:has-text("Decline")');
    await this.page.waitForTimeout(500);
    await this.page.click('button:has-text("Decline request")');
    await this.page.waitForTimeout(1500);
  }

  async returnBook() {
    await this.page.click('button:has-text("Return Book")');
    await this.page.waitForTimeout(500);
    await this.page.click('button:has-text("Confirm Return")');
    await this.page.waitForTimeout(1500);
    await this.page.click('button:has-text("Close")');
    await this.page.waitForTimeout(500);
  }
}
