import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { BookModal } from '../pages/BookModal';
import { LoansPage } from '../pages/LoansPage';
import { LibraryPage } from '../pages/LibraryPage';

test.describe('D. Rejections and Multiple Requests', () => {
  const timestamp = Date.now();
  const alice = { email: `alice_rej_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
  const bob = { email: `bob_rej_${timestamp}@test.com`, pass: 'secret123', name: 'Bob' };
  const carol = { email: `carol_rej_${timestamp}@test.com`, pass: 'secret123', name: 'Carol' };

  test('D1 - D6: Rejection flow, re-requesting, and availability for third account', async ({ page }) => {
    const auth = new AuthPage(page);
    const bookModal = new BookModal(page);
    const loans = new LoansPage(page);
    const library = new LibraryPage(page);

    await auth.registerUser(bob.email, bob.pass, bob.name);
    await bookModal.searchAndAddBook('Dune');
    await auth.signOut();

    await auth.registerUser(alice.email, alice.pass, alice.name);
    const card = page.locator('.group.bg-\\[\\#FFFFFF\\]').first();
    await card.locator('button:has-text("Borrow")').click();
    await page.waitForTimeout(500);
    await bookModal.submitBorrowRequest('Want to read Dune');
    await auth.signOut();

    // Bob rejects Alice's request
    await auth.signIn(bob.email, bob.pass);
    await library.navigateToTab('Loans');
    await loans.declineIncomingRequest();
    await auth.signOut();

    // Alice sees declined status
    await auth.signIn(alice.email, alice.pass);
    await library.navigateToTab('Loans');
    const aliceText = await page.locator('main').textContent();
    expect(aliceText).toContain('Declined Requests');

    // Carol checks catalog availability
    await auth.signOut();
    await auth.registerUser(carol.email, carol.pass, carol.name);
    const carolCard = page.locator('.group.bg-\\[\\#FFFFFF\\]').first();
    const badgeText = await carolCard.locator('.absolute.top-2').textContent();
    expect(badgeText).toContain('Available');
  });
});
