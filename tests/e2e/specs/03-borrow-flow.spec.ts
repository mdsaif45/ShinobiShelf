import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { BookModal } from '../pages/BookModal';
import { LoansPage } from '../pages/LoansPage';
import { LibraryPage } from '../pages/LibraryPage';

test.describe('C. Core Borrow Request Flow', () => {
  const timestamp = Date.now();
  const alice = { email: `alice_borrow_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
  const bob = { email: `bob_borrow_${timestamp}@test.com`, pass: 'secret123', name: 'Bob' };

  test('C1 - C8: Full borrow request, approval, and self-borrow prevention', async ({ page }) => {
    const auth = new AuthPage(page);
    const bookModal = new BookModal(page);
    const loans = new LoansPage(page);
    const library = new LibraryPage(page);

    // 1. Bob adds a book
    await auth.registerUser(bob.email, bob.pass, bob.name);
    await bookModal.searchAndAddBook('The Overstory');
    await auth.signOut();

    // 2. Alice registers and requests Bob's book
    await auth.registerUser(alice.email, alice.pass, alice.name);
    const firstCard = page.locator('.group.bg-\\[\\#FFFFFF\\]').first();
    const bookTitle = await firstCard.locator('h3').textContent();

    await firstCard.locator('button:has-text("Borrow")').click();
    await page.waitForTimeout(500);

    const dialogText = await page.locator('div[role="dialog"]').last().textContent();
    expect(dialogText).toContain('Request to Borrow');
    expect(dialogText).toContain('Start Date');
    expect(dialogText).toContain('Return Due Date');

    await bookModal.submitBorrowRequest('Please and thank you');

    // Reload & check Alice's Loans
    await page.reload();
    await library.navigateToTab('Loans');
    const aliceLoansText = await page.locator('main').textContent();
    expect(aliceLoansText).toContain(bookTitle?.trim());

    // 3. Bob approves incoming request
    await auth.signOut();
    await auth.signIn(bob.email, bob.pass);
    await library.navigateToTab('Loans');

    const bobLoansText = await page.locator('main').textContent();
    expect(bobLoansText).toContain('Incoming Borrow Requests');
    expect(bobLoansText).toContain('Alice');

    await loans.approveIncomingRequest();

    await page.reload();
    const bobActiveText = await page.locator('main').textContent();
    expect(bobActiveText).toContain('Books I\'m Lending Out (1)');

    // 4. Check Alice's status synchronization
    await auth.signOut();
    await auth.signIn(alice.email, alice.pass);
    await library.navigateToTab('Loans');

    const aliceActiveText = await page.locator('main').textContent();
    expect(aliceActiveText).toContain('Active Loan');
    expect(aliceActiveText).not.toContain('Approve');

    // 5. C8: Try to borrow own book as Bob
    await auth.signOut();
    await auth.signIn(bob.email, bob.pass);
    const ownBookCard = page.locator('.group.bg-\\[\\#FFFFFF\\]').last();
    await ownBookCard.locator('button:has-text("Borrow")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=This is your own book! You cannot borrow your own listing')).toBeVisible();
  });
});
