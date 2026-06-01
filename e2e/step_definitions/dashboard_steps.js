const { Given, When, Then } = require('@cucumber/cucumber');

// School Admin: SchoolAdminStatus renders h2 "Your School's Safety Status"
Then('I see the school admin status component with plain-English labels', async function () {
  await this.page.locator("text=Your School's Safety Status").first().waitFor({ timeout: 8000 });
});

// Staff dashboard shows "My Activity" — step defined in auth_steps.js
// Then('I see the My Activity section', ...) is in auth_steps.js

Then('resolved and archived incidents are not visible', async function () {
  const resolvedCount = await this.page.locator('text=resolved').count();
  const archivedCount = await this.page.locator('text=archived').count();
  if (resolvedCount > 0 || archivedCount > 0) {
    throw new Error('Staff should not see resolved or archived incidents on the dashboard');
  }
});

Given('at least one triggered incident exists', async function () {
  // Assumes seeded data contains triggered incidents
});

When('I click on an unacknowledged alert row in the dashboard', async function () {
  // Dashboard.jsx renders unacknowledged alert rows as div.cursor-pointer with bg-red-50 or bg-amber-50
  const row = this.page.locator(
    'div.bg-red-50.cursor-pointer, div.bg-amber-50.cursor-pointer, div.cursor-pointer'
  ).first();
  await row.waitFor({ timeout: 8000 });
  await row.click();
});

Then('I am navigated to the incident detail page for that alert', async function () {
  await this.page.waitForURL(url => /\/incidents\/[^/]+/.test(url.pathname), { timeout: 10000 });
});
