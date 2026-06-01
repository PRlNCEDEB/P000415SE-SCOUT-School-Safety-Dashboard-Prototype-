const { Then } = require('@cucumber/cucumber');

// ─── Navigation visibility checks ─────────────────────────────────────────────

// Company Admin: only sees Setup
Then('I see only the Setup navigation link', async function () {
  const setupEl = this.page.locator('nav a:has-text("Setup"), nav button:has-text("Setup")').first();
  await setupEl.waitFor({ timeout: 8000 });
  // Verify no other main nav items are visible
  for (const label of ['Dashboard', 'Incidents', 'Analytics', 'Notifications', 'Submit Alert']) {
    const count = await this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).count();
    if (count > 0) throw new Error(`Company Admin should not see "${label}" nav link — only Setup`);
  }
});

// School Admin: sees all six nav items
Then('I see navigation links for Dashboard, Submit Alert, Incidents, Analytics, Notifications, and Setup', async function () {
  for (const label of ['Dashboard', 'Submit Alert', 'Incidents', 'Analytics', 'Notifications', 'Setup']) {
    const el = this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).first();
    await el.waitFor({ timeout: 8000 });
  }
});

// Staff: sees Dashboard, Submit Alert, Incidents only
Then('I see navigation links for Dashboard, Submit Alert, and Incidents only', async function () {
  for (const label of ['Dashboard', 'Submit Alert', 'Incidents']) {
    const el = this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).first();
    await el.waitFor({ timeout: 8000 });
  }
});

Then('I do not see links for Analytics, Notifications, or Setup', async function () {
  for (const label of ['Analytics', 'Notifications', 'Setup']) {
    const count = await this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).count();
    if (count > 0) throw new Error(`Staff should not see "${label}" nav link`);
  }
});

Then('I do not see a {string} navigation link', async function (label) {
  const count = await this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).count();
  if (count > 0) throw new Error(`Expected nav link "${label}" to be absent but it was found`);
});

Then('I do not see an {string} navigation link', async function (label) {
  const count = await this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).count();
  if (count > 0) throw new Error(`Expected nav link "${label}" to be absent but it was found`);
});

Then('I do not see a {string} link in the navigation', async function (label) {
  const count = await this.page.locator(`nav a:has-text("${label}"), nav button:has-text("${label}")`).count();
  if (count > 0) throw new Error(`Expected "${label}" link to be absent in nav but was found`);
});
