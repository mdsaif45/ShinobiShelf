import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { LibraryPage } from '../pages/LibraryPage';
import { BookModal } from '../pages/BookModal';

test.describe('B. Catalog, Search, and Filtering', () => {
  const timestamp = Date.now();
  const alice = { email: `alice_cat_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
  const bob = { email: `bob_cat_${timestamp}@test.com`, pass: 'secret123', name: 'Bob' };

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    const bookModal = new BookModal(page);
    await auth.registerUser(bob.email, bob.pass, bob.name);
    await bookModal.searchAndAddBook('The Overstory');
    await auth.signOut();
  });

  test('B1 & B2: Catalog visibility & My Books zero state', async ({ page }) => {
    const auth = new AuthPage(page);
    const library = new LibraryPage(page);

    await auth.registerUser(alice.email, alice.pass, alice.name);
    const count = await library.getBookCardsCount();
    expect(count).toBeGreaterThan(0);

    await library.navigateToTab('My Books');
    const myCount = await library.getBookCardsCount();
    expect(myCount).toBe(0);
    await expect(page.locator('text=Your Shared Shelf is Empty')).toBeVisible();
  });

  test('B3: Search filter functionality', async ({ page }) => {
    const auth = new AuthPage(page);
    const library = new LibraryPage(page);

    await auth.signIn(alice.email, alice.pass);
    await library.searchCatalog('Overstory');
    const matchedCount = await library.getBookCardsCount();
    expect(matchedCount).toBeGreaterThan(0);

    await library.searchCatalog('zzzz_non_existent');
    const emptyCount = await library.getBookCardsCount();
    expect(emptyCount).toBe(0);
    await expect(page.locator('text=No books found matching your search')).toBeVisible();
  });

  test('B5: Empty search input warning in Add Book modal', async ({ page }) => {
    const auth = new AuthPage(page);
    const bookModal = new BookModal(page);

    await auth.signIn(alice.email, alice.pass);
    await bookModal.openAddBookModal();
    await page.click('button[type="submit"]:has-text("Search")');
    await expect(page.locator('text=Enter a title, author or ISBN to search')).toBeVisible();
  });
});
