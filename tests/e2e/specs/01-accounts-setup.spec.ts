import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { BookModal } from '../pages/BookModal';

test.describe('A. Accounts Setup & Initialization', () => {
  const timestamp = Date.now();
  const alice = { email: `alice_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
  const bob = { email: `bob_${timestamp}@test.com`, pass: 'secret123', name: 'Bob' };

  test('A1: Register Account Alice & Onboarding', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.registerUser(alice.email, alice.pass, alice.name);
    await expect(page).toHaveURL(/.*\/library/);
    const text = await page.locator('nav').textContent();
    expect(text).toContain('Alice');
  });

  test('A2: Sign Out & Route Guard', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.registerUser(alice.email, alice.pass, alice.name);
    await auth.signOut();
    await expect(page).toHaveURL(/.*\/auth/);

    await page.goto('http://localhost:3000/library');
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/.*\/auth/);
  });

  test('A3: Register Account Bob', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.registerUser(bob.email, bob.pass, bob.name);
    await expect(page).toHaveURL(/.*\/library/);
  });

  test('A4 & A5 & A6: Add Books as Bob & Verify Details/Reviews', async ({ page }) => {
    const auth = new AuthPage(page);
    const bookModal = new BookModal(page);

    await auth.registerUser(bob.email, bob.pass, bob.name);
    await bookModal.searchAndAddBook('The Overstory');

    await page.reload();
    await page.waitForTimeout(1000);

    const firstCard = page.locator('.group.bg-\\[\\#FFFFFF\\]').first();
    const ownerText = await firstCard.locator('span:has-text("Owned by")').textContent();
    expect(ownerText).toContain('Bob');

    await firstCard.click();
    await page.waitForTimeout(800);

    const modalText = await page.locator('div[role="dialog"]').last().textContent();
    expect(modalText).not.toContain('Sarah Jenkins');
    expect(modalText).toContain('Circle Reviews (0)');
  });
});
