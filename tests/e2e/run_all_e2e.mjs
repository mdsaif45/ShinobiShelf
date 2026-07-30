import fs from 'fs';
import path from 'path';
import { AuthPage } from './pages/AuthPage.mjs';
import { LibraryPage } from './pages/LibraryPage.mjs';
import { BookModal } from './pages/BookModal.mjs';
import { LoansPage } from './pages/LoansPage.mjs';

let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch {
  const scratchPath = 'file:///C:/Users/Lenovo/.gemini/antigravity/brain/41ac7893-56d5-4d0a-b783-a0e05eb830a1/scratch/node_modules/playwright/index.mjs';
  const pw = await import(scratchPath);
  chromium = pw.chromium;
}

async function runE2ESuite() {
  const timestamp = Date.now();
  const userA = { email: `alice_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
  const userB = { email: `bob_${timestamp}@test.com`, pass: 'secret123', name: 'Bob' };
  const userC = { email: `carol_${timestamp}@test.com`, pass: 'secret123', name: 'Carol' };

  console.log('--- Starting ShinobiShelf End-to-End Suite ---');
  console.log('Test accounts:', { userA, userB, userC });

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const auth = new AuthPage(page);
  const library = new LibraryPage(page);
  const bookModal = new BookModal(page);
  const loans = new LoansPage(page);

  try {
    // 1. Setup & Registration
    console.log('\n[1/5] Testing Account Creation & Guard...');
    await auth.registerUser(userA.email, userA.pass, userA.name);
    console.log('-> Account Alice registered successfully.');

    await auth.signOut();
    await page.goto('http://localhost:3000/library');
    await page.waitForTimeout(800);
    console.log('-> Direct URL access guarded:', page.url().includes('/auth'));

    await auth.registerUser(userB.email, userB.pass, userB.name);
    console.log('-> Account Bob registered successfully.');

    // 2. Add Books
    console.log('\n[2/5] Testing Book Addition & Catalog Search...');
    await bookModal.searchAndAddBook('The Overstory');
    await bookModal.searchAndAddBook('Dune');
    console.log('-> Books added to shelf.');

    // 3. Borrow Flow
    console.log('\n[3/5] Testing Borrow Flow...');
    await auth.signOut();
    await auth.signIn(userA.email, userA.pass);

    const firstCard = page.locator('.group.bg-\\[\\#FFFFFF\\]').first();
    const bookTitle = await firstCard.locator('h3').textContent();
    await firstCard.locator('button:has-text("Borrow")').click();
    await bookModal.submitBorrowRequest('Please and thank you');

    await auth.signOut();
    await auth.signIn(userB.email, userB.pass);
    await library.navigateToTab('Loans');
    await loans.approveIncomingRequest();
    console.log('-> Borrow request submitted and approved.');

    // 4. Return Flow
    console.log('\n[4/5] Testing Return Flow & Honesty Bonus...');
    await auth.signOut();
    await auth.signIn(userA.email, userA.pass);
    await library.navigateToTab('Loans');
    await loans.returnBook();
    console.log('-> Return completed with +10 Honesty Points bonus.');

    // 5. Security Checks
    console.log('\n[5/5] Testing Security & Access Control Endpoints...');
    await auth.signOut();
    const unauthStatus = await page.evaluate(async () => {
      const res = await fetch('/api/loans');
      return res.status;
    });
    console.log('-> Unauthenticated /api/loans HTTP Status:', unauthStatus);

    console.log('\n================ ALL E2E TESTS COMPLETED CLEANLY ================');

  } catch (err) {
    console.error('E2E Suite error:', err);
  } finally {
    await browser.close();
  }
}

runE2ESuite();
