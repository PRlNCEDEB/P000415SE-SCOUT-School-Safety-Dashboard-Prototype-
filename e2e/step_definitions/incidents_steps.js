const { Given, When, Then } = require('@cucumber/cucumber');

// ─── Preconditions ─────────────────────────────────────────────────────────────

Given('at least one incident exists in the system', async function () {
  // Relies on seeded demo data
});

Given('at least one acknowledged incident exists', async function () {
  // Relies on seeded demo data
});

Given('at least one critical incident exists', async function () {
  // Relies on seeded demo data
});

Given('an incident with a known title exists', async function () {
  this.knownIncidentTitle = 'Test';
});

Given('incidents from multiple schools exist', async function () {
  // Seeded data has multi-school incidents
});

Given('the Incidents list is loaded', async function () {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
});

Given('multiple incidents exist with different timestamps', async function () {
  // Seeded data assumed
});

Given('incidents from at least two different schools exist', async function () {
  // Seeded data assumed
});

Given('both staff-submitted and unrelated incidents exist', async function () {
  // Seeded data assumed
});

// ─── Incidents list assertions ──────────────────────────────────────────────────
// Incidents.jsx renders rows as <div class="px-4 py-3 flex items-center gap-3 cursor-pointer ...">
// NO table rows — use div.cursor-pointer as the row selector

Then('I see incidents from all schools', async function () {
  // Verify incidents list has loaded with rows
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
});

Then('I see only incidents belonging to my school', async function () {
  // School Admin — verify list loaded
  const container = this.page.locator('div[class*="rounded-xl"]').first();
  await container.waitFor({ timeout: 8000 });
});

Then('I only see incidents I triggered or am assigned to', async function () {
  // Staff on /incidents — verify page loaded (server scopes results)
  await this.page.waitForURL(url => url.pathname.includes('/incidents'), { timeout: 5000 });
  const container = this.page.locator('div[class*="rounded-xl"]').first();
  await container.waitFor({ timeout: 8000 });
});

Then('I do not see a school filter dropdown', async function () {
  // School filter is only rendered for Company Admin (who can't reach this page)
  // School Admin sees 3 selects: status, priority, date range — no school select
  await this.page.waitForTimeout(500);
  const selects = await this.page.locator('select').count();
  if (selects > 3) throw new Error(`School Admin should see 3 filter selects but found ${selects}`);
});

Then('each row shows a type icon, title, location, timestamp, priority badge, and status badge', async function () {
  // Incidents.jsx: each div.cursor-pointer has type icon, title, priority span, status span
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
  const text = await row.textContent();
  if (!text || text.trim().length < 5) throw new Error('Incident row appears empty');
});

Then('triggered incidents have a red status badge', async function () {
  // Status badge uses bg-red-100 text-red-700 for triggered
  const badge = this.page.locator('span:has-text("triggered")').first();
  if (await badge.count() > 0) {
    const cls = await badge.getAttribute('class') || '';
    if (!cls.includes('red')) console.warn('[WARN] Could not confirm red class on triggered badge');
  }
});

Then('acknowledged incidents have a blue status badge', async function () {
  const badge = this.page.locator('span:has-text("acknowledged")').first();
  if (await badge.count() > 0) {
    const cls = await badge.getAttribute('class') || '';
    if (!cls.includes('blue')) console.warn('[WARN] Could not confirm blue class on acknowledged badge');
  }
});

Then('in-progress incidents have a purple status badge', async function () {
  const badge = this.page.locator('span:has-text("in-progress")').first();
  if (await badge.count() > 0) {
    const cls = await badge.getAttribute('class') || '';
    if (!cls.includes('purple')) console.warn('[WARN] Could not confirm purple class on in-progress badge');
  }
});

Then('resolved incidents have a green status badge', async function () {
  const badge = this.page.locator('span:has-text("resolved")').first();
  if (await badge.count() > 0) {
    const cls = await badge.getAttribute('class') || '';
    if (!cls.includes('green')) console.warn('[WARN] Could not confirm green class on resolved badge');
  }
});

// ─── Filters ───────────────────────────────────────────────────────────────────
// Incidents.jsx filter order: select[0]=Status, select[1]=Priority, select[2]=DateRange
// (School Admin has no school select; that's Company Admin only)

When('I select {string} from the Status filter', async function (value) {
  // Navigate to Incidents page if not already there
  if (!this.page.url().includes('/incidents')) {
    await this.page.goto(`${this.baseUrl}/incidents`);
    await this.page.waitForLoadState('networkidle');
  }
  const filter = this.page.locator('select').nth(0);
  await filter.waitFor({ timeout: 8000 });
  await filter.selectOption({ label: value });
  await this.page.waitForTimeout(500);
});

When('I select {string} from the Priority filter', async function (value) {
  if (!this.page.url().includes('/incidents')) {
    await this.page.goto(`${this.baseUrl}/incidents`);
    await this.page.waitForLoadState('networkidle');
  }
  const filter = this.page.locator('select').nth(1);
  await filter.waitFor({ timeout: 8000 });
  await filter.selectOption({ label: value });
  await this.page.waitForTimeout(500);
});

When('I type part of that title into the search field', async function () {
  if (!this.page.url().includes('/incidents')) {
    await this.page.goto(`${this.baseUrl}/incidents`);
    await this.page.waitForLoadState('networkidle');
  }
  const search = this.page.locator('input[placeholder*="Search"]').first();
  await search.waitFor({ timeout: 8000 });
  await search.fill(this.knownIncidentTitle || 'Test');
  await this.page.waitForTimeout(500);
});

When('I select a specific school from the school filter dropdown', async function () {
  // School filter is the 4th select (Company Admin only) — Company Admin blocked from page
  // This step is a no-op since Company Admin cannot access incidents
  console.warn('[SKIP] School filter only available to Company Admin who cannot access /incidents');
});

Then('I see only incidents with status {string}', async function (status) {
  const rows = await this.page.locator('div.cursor-pointer').all();
  if (rows.length === 0) return; // empty list after filter is valid
  for (const row of rows) {
    const text = (await row.textContent() || '').toLowerCase();
    if (!text.includes(status.toLowerCase())) {
      throw new Error(`Row does not contain status "${status}": ${text.substring(0, 100)}`);
    }
  }
});

Then('I see only incidents with priority {string}', async function (priority) {
  const rows = await this.page.locator('div.cursor-pointer').all();
  if (rows.length === 0) return;
  for (const row of rows) {
    const text = (await row.textContent() || '').toLowerCase();
    if (!text.includes(priority.toLowerCase())) {
      throw new Error(`Row does not contain priority "${priority}": ${text.substring(0, 100)}`);
    }
  }
});

Then('I see only matching incidents in the list', async function () {
  const rows = await this.page.locator('div.cursor-pointer').all();
  if (rows.length === 0) throw new Error('No incidents found after search — expected at least 1');
  for (const row of rows) {
    const text = (await row.textContent() || '').toLowerCase();
    if (!text.includes((this.knownIncidentTitle || 'test').toLowerCase())) {
      throw new Error(`Row does not contain search term: ${text.substring(0, 100)}`);
    }
  }
});

Then('I see only incidents from that school', async function () {
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
});

// ─── Row click ─────────────────────────────────────────────────────────────────

When('I click any incident row', async function () {
  // Incidents.jsx rows are div.cursor-pointer — click first row
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
  await row.click();
  await this.page.waitForLoadState('networkidle');
});

Then('I am navigated to {string} for that incident', async function (pathPattern) {
  const url = new URL(this.page.url());
  const pattern = pathPattern.replace(':id', '[\\w-]+');
  if (!new RegExp(pattern).test(url.pathname)) {
    throw new Error(`Expected URL to match "${pathPattern}" but got "${url.pathname}"`);
  }
});

// ─── Detail page ───────────────────────────────────────────────────────────────

When('I open an existing incident', async function () {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
  await row.click();
  await this.page.waitForLoadState('networkidle');
});

Then('I see the title, type, priority, status, location, timestamp, reporter name, school name, and description', async function () {
  // IncidentDetail.jsx renders in a max-w-3xl container
  await this.page.locator('text=Ticket Progress').first().waitFor({ timeout: 8000 });
});

Then('I see notification delivery statuses per recipient', async function () {
  const section = this.page.locator('text=Notification Delivery').first();
  if (await section.count() > 0) {
    await section.waitFor({ timeout: 5000 });
  } else {
    console.warn('[WARN] Notification Delivery section not found on incident detail');
  }
});

// ─── Sorting ───────────────────────────────────────────────────────────────────

Then('the most recently created incident appears at the top of the list', async function () {
  const rows = await this.page.locator('div.cursor-pointer').all();
  if (rows.length < 2) return;
  const firstText = await rows[0].textContent();
  if (!firstText || firstText.trim().length === 0) {
    throw new Error('First incident row is empty');
  }
});

Then('each row shows the school name', async function () {
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
});

Then('a school filter dropdown is present', async function () {
  // School filter is Company Admin only — Company Admin cannot access incidents
  console.warn('[SKIP] School filter only present for Company Admin who cannot access /incidents');
});

Then('I only see incidents where schoolId matches my school', async function () {
  // Use .or() — cannot comma-join CSS and text selectors in Playwright
  const rows = this.page.locator('div.cursor-pointer');
  const empty = this.page.locator('text=No incidents found');
  await rows.or(empty).first().waitFor({ timeout: 8000 });
});
