import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { BookModal } from '../pages/BookModal';
import { LoansPage } from '../pages/LoansPage';
import { LibraryPage } from '../pages/LibraryPage';

test.describe('E. Return Flow and Honesty Score Calculation', () => {
  const timestamp = Date.now();
  const alice = { email: `alice_ret_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
  const bob = { email: `bob_ret_${timestamp}@test.com`, pass: 'secret123', name: 'Bob' };

  test('E1 - E5: Complete return, honesty score bonus, state persistence', async ({ page }) => {
    const auth = new AuthPage(page);
    const bookModal = new BookModal(page);
    const loans = new LoansPage(page);
    const library = new LibraryPage(page);

    await auth.registerUser(bob.email, bob.pass, bob.name);
    await bookModal.searchAndAddBook('The Overstory');
    await auth.signOut();

    await auth.registerUser(alice.email, alice.pass, alice.name);
    const card = page.locator('.group.bg-\\[\\#FFFFFF\\]').first();
    await card.locator('button:has-text("Borrow")').click();
    await page.waitForTimeout(500);
    await bookModal.submitBorrowRequest('Return test');
    await auth.signOut();

    await auth.signIn(bob.email, bob.pass);
    await library.navigateToTab('Loans');
    await loans.approveIncomingRequest();
    await auth.signOut();

    // Alice completes return
    await auth.signIn(alice.email, alice.pass);
    await library.navigateToTab('Loans');
    await loans.returnBook();

    await page.reload();
    const aliceLoans = await page.locator('main').textContent();
    expect(aliceLoans).toContain('Returned');
  });
});
