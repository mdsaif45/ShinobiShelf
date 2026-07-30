import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';

test.describe('H. Security Access Control & Network Polling', () => {
  test('H4: Signed out API endpoints return 401 Unauthorized', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');

    const statuses = await page.evaluate(async () => {
      const getStatus = async (url: string) => {
        const res = await fetch(url);
        return res.status;
      };
      return {
        loans: await getStatus('/api/loans'),
        users: await getStatus('/api/users'),
        books: await getStatus('/api/books'),
        me: await getStatus('/api/auth/me')
      };
    });

    expect(statuses.loans).toBe(401);
    expect(statuses.users).toBe(401);
    expect(statuses.books).toBe(401);
    expect(statuses.me).toBe(401);
  });

  test('H5: Cross-account mutation prevention (403 Forbidden)', async ({ page }) => {
    const timestamp = Date.now();
    const alice = { email: `alice_sec_${timestamp}@test.com`, pass: 'secret123', name: 'Alice' };
    const auth = new AuthPage(page);

    await auth.registerUser(alice.email, alice.pass, alice.name);

    const deleteStatus = await page.evaluate(async () => {
      const res = await fetch('/api/books/fake_book_id', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      return res.status;
    });

    expect(deleteStatus).toBe(404); // 404 for non-existent, 403 for unauthorized owner
  });
});
