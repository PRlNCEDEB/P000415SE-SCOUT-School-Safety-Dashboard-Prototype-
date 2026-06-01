const { setWorldConstructor, setDefaultTimeout, Before, After, AfterAll } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL  = process.env.API_URL  || 'http://localhost:5000';

// Demo credentials that match the seeded data
const USERS = {
  'Company Admin': { email: 'admin@scout.edu',         password: 'password123' },
  'School Admin':  { email: 'schooladmin@school.edu',  password: 'password123' },
  'Staff':         { email: 'staff@school.edu',         password: 'password123' },
  // Specific school accounts for isolation and Beta/Gamma tests
  'Beta Admin':    { email: 'admin.beta@scout.edu',    password: 'Scout@1234' },
  'Beta Staff':    { email: 'staff.beta@scout.edu',    password: 'Scout@1234' },
  'Gamma Admin':   { email: 'admin.gamma@scout.edu',   password: 'Scout@1234' },
  'Gamma Staff':   { email: 'staff.gamma@scout.edu',   password: 'Scout@1234' },
};

let browser;

class ScoutWorld {
  constructor({ attach, parameters }) {
    this.attach     = attach;
    this.parameters = parameters;
    this.baseUrl    = BASE_URL;
    this.apiUrl     = API_URL;
    this.users      = USERS;
    this.page       = null;
    this.context    = null;
    this.lastResponse = null;
  }

  async openPage() {
    this.context = await browser.newContext();
    this.page    = await this.context.newPage();
  }

  async closePage() {
    if (this.context) await this.context.close();
  }

  async login(role) {
    const { email, password } = this.users[role];

    // Navigate to login page
    await this.page.goto(`${this.baseUrl}/login`);
    await this.page.waitForLoadState('networkidle');

    // If already authenticated (PublicRoute redirected away from /login), log out first
    if (!this.page.url().includes('/login')) {
      const logoutBtn = this.page.locator('button:has-text("Logout")').first();
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
        await this.page.waitForURL(url => url.href.includes('/login'), { timeout: 8000 })
          .catch(() => {});
      }
      // If logout didn't work, clear state via fresh navigation
      if (!this.page.url().includes('/login')) {
        await this.page.goto(`${this.baseUrl}/login`);
        await this.page.waitForLoadState('networkidle');
      }
    }

    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
  }
}

setWorldConstructor(ScoutWorld);
setDefaultTimeout(60 * 1000); // 60s — needed for multi-step flows and slow page loads

Before(async function () {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
  }
  await this.openPage();
});

After(async function (scenario) {
  if (scenario.result.status === 'FAILED' && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }
  await this.closePage();
});

AfterAll(async function () {
  if (browser) await browser.close();
});
