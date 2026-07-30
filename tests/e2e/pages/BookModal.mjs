export class BookModal {
  constructor(page) {
    this.page = page;
  }

  async openAddBookModal() {
    await this.page.click('button:has-text("Add Book")');
    await this.page.waitForTimeout(500);
  }

  async searchAndAddBook(query) {
    await this.openAddBookModal();
    await this.page.fill('input[placeholder*="Search by title"]', query);
    await this.page.click('button[type="submit"]:has-text("Search")');
    await this.page.waitForTimeout(2500);
    await this.page.click('button:has-text("Add to Library")');
    await this.page.waitForTimeout(1500);
  }

  async submitBorrowRequest(note) {
    if (note) {
      await this.page.fill('textarea[placeholder*="Hi, I\'d love to read"]', note);
    }
    await this.page.click('button[type="submit"]:has-text("Send Request")');
    await this.page.waitForTimeout(3000);
  }

  async closeModal() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(300);
  }
}
