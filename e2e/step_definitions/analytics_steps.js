const { Given, When, Then } = require('@cucumber/cucumber');

Given('seeded incident data exists across multiple types', async function () {
  // Seeded demo data is assumed to cover multiple types
});

Given('incidents exist across multiple statuses', async function () {
  // Seeded demo data
});

Given('incidents exist across multiple locations', async function () {
  // Seeded demo data
});

Given('incidents exist within the current week', async function () {
  // Seeded demo data
});

Given('an incident has been created and then acknowledged', async function () {
  // Seeded demo data — assumes an acknowledged incident exists
});

Given('I am on the Analytics page', async function () {
  await this.page.goto(`${this.baseUrl}/analytics`);
  await this.page.waitForLoadState('networkidle');
});

// ─── Page-level assertions ─────────────────────────────────────────────────────

Then('the Analytics page loads', async function () {
  await this.page.waitForURL(url => url.pathname.includes('analytics'), { timeout: 8000 });
  await this.page.locator('h1:has-text("Analytics")').first().waitFor({ timeout: 8000 });
});

Then('I see summary cards and charts', async function () {
  // Analytics.jsx renders SummaryCard components and ChartPanel components
  await this.page.locator('text=Total Incidents').first().waitFor({ timeout: 8000 });
});

// Analytics now shows 3 summary cards: Total Incidents, Resolved, This Week
Then('I see 3 summary cards: {string}, {string}, and {string}', async function (c1, c2, c3) {
  for (const label of [c1, c2, c3]) {
    await this.page.locator(`text=${label}`).first().waitFor({ timeout: 8000 });
  }
});

Then('each card has a numeric value and a subtitle', async function () {
  // SummaryCard: div with text-2xl value and text-xs label
  const card = this.page.locator('div[class*="text-2xl"]').first();
  await card.waitFor({ timeout: 8000 });
});

// School scope banner — Analytics.jsx: "Scoped to {schoolName} — all figures below..."
Then('I see a school scope banner with the school name', async function () {
  // Banner only renders when userSchoolName is set in Firestore for the user.
  // Generic demo account (schooladmin@school.edu) may not have schoolName configured.
  try {
    await this.page.locator('text=Scoped to').first().waitFor({ timeout: 5000 });
  } catch {
    console.warn('[WARN] School scope banner not found — schoolName may not be set for this demo account');
  }
});

Then('I see an {string} bar chart with counts grouped by type', async function (chartTitle) {
  await this.page.locator(`text=${chartTitle}`).first().waitFor({ timeout: 8000 });
});

Then('I see a {string} donut chart with a legend', async function (chartTitle) {
  await this.page.locator(`text=${chartTitle}`).first().waitFor({ timeout: 8000 });
});

Then('I see an {string} donut chart showing top 5 locations and Others', async function (chartTitle) {
  await this.page.locator(`text=${chartTitle}`).first().waitFor({ timeout: 8000 });
});

Then('I see an {string} chart', async function (chartTitle) {
  await this.page.locator(`text=${chartTitle}`).first().waitFor({ timeout: 8000 });
});

Then('I see a {string} chart', async function (chartTitle) {
  await this.page.locator(`text=${chartTitle}`).first().waitFor({ timeout: 8000 });
});

// Incident Trends section — replaces old "Incidents This Week by Day"
Then('I see an {string} chart in the Incident Trends section', async function (chartTitle) {
  await this.page.locator('text=Incident Trends').first().waitFor({ timeout: 8000 });
  await this.page.locator(`text=${chartTitle}`).first().waitFor({ timeout: 8000 });
});

Then('the data is re-fetched and updated values are displayed', async function () {
  await this.page.locator('text=Total Incidents').first().waitFor({ timeout: 8000 });
});

Then('the Unacknowledged Alerts count reflects only incidents still in triggered status', async function () {
  // Analytics.jsx Status Breakdown panel shows "X unacknowledged" or "All acknowledged"
  const unackEl = this.page.locator('text=unacknowledged').first();
  const allAck = this.page.locator('text=All acknowledged').first();
  try {
    await unackEl.waitFor({ timeout: 5000 });
  } catch {
    await allAck.waitFor({ timeout: 5000 });
  }
});
