import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { LibraryPage } from '../pages/LibraryPage';

test.describe('F & G. Reviews, Wishlist, Clubs, and Memory Features', () => {
  const timestamp = Date.now();
  const alice = { email: `alice_mem_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.registerUser(alice.email, alice.pass, alice.name);
  });

  test('F5 & G1: Wishlist tab visibility', async ({ page }) => {
    const library = new LibraryPage(page);
    await library.navigateToTab('Wishlist');
    await expect(page.locator('main')).toBeVisible();
  });

  test('G2: Book Clubs tab visibility', async ({ page }) => {
    const library = new LibraryPage(page);
    await library.navigateToTab('More');
    await page.click('button:has-text("Book Clubs")');
    await expect(page.locator('main')).toBeVisible();
  });
});
