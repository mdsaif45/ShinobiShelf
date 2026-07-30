import { Page, expect } from '@playwright/test';

export class LibraryPage {
  constructor(private page: Page) {}

  async navigateToTab(tabName: string) {
    await this.page.click(`button:has-text("${tabName}")`);
    await this.page.waitForTimeout(500);
  }

  async searchCatalog(query: string) {
    await this.page.fill('input[placeholder*="Filter title or author"]', query);
    await this.page.waitForTimeout(300);
  }

  async selectGenreFilter(genre: string) {
    const trigger = this.page.locator('.relative.inline-block span').first();
    await trigger.click();
    await this.page.waitForTimeout(300);

    const option = this.page.locator(`div[role="option"]:has-text("${genre}"), span:has-text("${genre}")`).last();
    await option.click();
    await this.page.waitForTimeout(300);
  }

  async getBookCardsCount() {
    return await this.page.locator('.group.bg-\\[\\#FFFFFF\\]').count();
  }

  async getBookCardTitles() {
    const cards = await this.page.locator('.group.bg-\\[\\#FFFFFF\\]').all();
    const titles: string[] = [];
    for (const card of cards) {
      const title = await card.locator('h3').textContent();
      if (title) titles.push(title.trim());
    }
    return titles;
  }
}
