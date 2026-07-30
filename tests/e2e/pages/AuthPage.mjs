export class AuthPage {
  constructor(page) {
    this.page = page;
  }

  async navigateToAuth() {
    await this.page.goto('http://localhost:3000/auth');
    await this.page.waitForLoadState('networkidle');
  }

  async registerUser(email, pass, name, genres = ['Fiction', 'Fantasy', 'Mystery']) {
    await this.navigateToAuth();

    const registerToggle = this.page.locator('button:has-text("Don\'t have an account? Register")');
    if (await registerToggle.isVisible().catch(() => false)) {
      await registerToggle.click();
      await this.page.waitForTimeout(300);
    }

    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button[type="submit"]:has-text("Register")');
    await this.page.waitForTimeout(1000);

    if (this.page.url().includes('/onboarding')) {
      await this.page.fill('input[placeholder*="Julian"]', name);
      await this.page.click('button:has-text("Continue")');
      await this.page.waitForTimeout(500);

      for (const genre of genres) {
        const genreBtn = this.page.locator(`button:has-text("${genre}")`);
        if (await genreBtn.isVisible().catch(() => false)) {
          await genreBtn.click();
        }
      }
      await this.page.click('button:has-text("Enter the Library")');
      await this.page.waitForTimeout(1500);
    }
  }

  async signIn(email, pass) {
    await this.navigateToAuth();

    const signInToggle = this.page.locator('button:has-text("Already have an account? Sign in")');
    if (await signInToggle.isVisible().catch(() => false)) {
      await signInToggle.click();
      await this.page.waitForTimeout(300);
    }

    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button[type="submit"]:has-text("Sign in")');
    await this.page.waitForTimeout(1500);
  }

  async signOut() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(300);
    const avatarBtn = this.page.locator('nav button').last();
    await avatarBtn.click();
    await this.page.waitForTimeout(300);
    const signOutBtn = this.page.locator('button:has-text("Sign out")');
    await signOutBtn.click();
    await this.page.waitForTimeout(1000);
  }
}
