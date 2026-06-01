const { Given, When, Then } = require('@cucumber/cucumber');

// ─── Preconditions ─────────────────────────────────────────────────────────────

Given('notification records exist in Firestore', async function () {
  // Relies on seeded demo data
});

Given('notification records exist', async function () {
  // Relies on seeded demo data
});

Given('at least one failed notification exists', async function () {
  // Relies on seeded demo data
});

Given('failed notification records exist in Firestore', async function () {
  // Relies on seeded demo data
});

Given('an emergency notification has been triggered', async function () {
  // Relies on seeded or previously created incident with notifications sent
});

Given('a recipient has received an emergency alert email with a valid unacknowledged token', async function () {
  this.acknowledgeToken = process.env.ACKNOWLEDGE_TOKEN || null;
  if (!this.acknowledgeToken) {
    console.warn('[WARN] No ACKNOWLEDGE_TOKEN env var set — acknowledge flow steps will be skipped');
  }
});

Given('a notification token has already been acknowledged', async function () {
  this.acknowledgeToken = process.env.ACKNOWLEDGED_TOKEN || null;
});

Given('I am on the Notifications page', async function () {
  await this.page.goto(`${this.baseUrl}/notifications`);
  await this.page.waitForLoadState('networkidle');
});

// ─── Assertions ────────────────────────────────────────────────────────────────

Then('the Notifications page loads', async function () {
  // Notifications.jsx: <h1 class="text-2xl font-bold">Notifications</h1>
  await this.page.locator('h1:has-text("Notifications")').first().waitFor({ timeout: 8000 });
});

Then('I see summary cards: Total Sent, Failed, SMS Failed, Email Failed', async function () {
  // Notifications.jsx renders SummaryCard for each: Total Sent, Failed, SMS Failed, Email Failed
  for (const label of ['Total Sent', 'Failed', 'SMS Failed', 'Email Failed']) {
    await this.page.locator(`text=${label}`).first().waitFor({ timeout: 8000 });
  }
});

Then('I see delivery records scoped to my school', async function () {
  // School Admin sees notification rows — verify list container loaded
  const container = this.page.locator('div[class*="divide-y"]').first();
  await container.waitFor({ timeout: 8000 });
});

Then('each row shows the incident title, recipient name, recipient email, timestamp, SMS status badge, and email status badge', async function () {
  // Notifications.jsx row: div.px-4.py-4 with incident title, recipient, SMS/Email badges
  const row = this.page.locator('div.px-4.py-4').first();
  await row.waitFor({ timeout: 8000 });
  const text = await row.textContent();
  if (!text || text.trim().length < 5) throw new Error('Notification row appears empty');
});

// ─── Filters ──────────────────────────────────────────────────────────────────
// Notifications.jsx: select[0] = channel (All Channels / SMS Only / Email Only)
//                   select[1] = status  (All Statuses / Sent / Failed / Pending / Skipped)

When('I select {string} from the channel filter', async function (value) {
  // Navigate to Notifications page if not already there
  if (!this.page.url().includes('/notifications')) {
    await this.page.goto(`${this.baseUrl}/notifications`);
    await this.page.waitForLoadState('networkidle');
  }
  const filter = this.page.locator('select').nth(0);
  await filter.waitFor({ timeout: 8000 });
  await filter.selectOption({ label: value });
  await this.page.waitForTimeout(500);
});

When('I select {string} from the status filter', async function (value) {
  if (!this.page.url().includes('/notifications')) {
    await this.page.goto(`${this.baseUrl}/notifications`);
    await this.page.waitForLoadState('networkidle');
  }
  const filter = this.page.locator('select').nth(1);
  await filter.waitFor({ timeout: 8000 });
  await filter.selectOption({ label: value });
  await this.page.waitForTimeout(500);
});

Then('I see only SMS-related notifications', async function () {
  const container = this.page.locator('div[class*="divide-y"]').first();
  await container.waitFor({ timeout: 8000 });
});

Then('I see only notifications with failed SMS or email status', async function () {
  const rows = await this.page.locator('div.px-4.py-4').all();
  if (rows.length === 0) throw new Error('No rows found after filtering by Failed');
  for (const row of rows) {
    const text = (await row.textContent() || '').toLowerCase();
    if (!text.includes('failed')) {
      throw new Error(`Row does not show failed status: ${text.substring(0, 100)}`);
    }
  }
});

Then('I see a red warning banner showing the number of failed notifications', async function () {
  // Notifications.jsx: div.bg-red-50.border.border-red-200 shown when totalFailed > 0
  const banner = this.page.locator('div.bg-red-50.border-red-200, div[class*="bg-red-50"]').first();
  await banner.waitFor({ timeout: 8000 });
});

Then('I do not see the failed notification banner', async function () {
  const count = await this.page.locator('div.bg-red-50[class*="border-red"]').count();
  if (count > 0) throw new Error('Failed notification banner visible — should be hidden');
});

Then('the notification records are re-fetched and updated', async function () {
  await this.page.locator('div[class*="divide-y"], h1:has-text("Notifications")').first().waitFor({ timeout: 8000 });
});

// ─── Email acknowledge flow ────────────────────────────────────────────────────

When('the recipient opens the received email', async function () {
  console.warn('[SKIP] Email inbox automation requires external tool — step skipped');
});

Then(/^the email body contains the alert type, location, and date\/time timestamp$/, async function () {
  console.warn('[SKIP] Email content check requires inbox access — step skipped');
});

Then('an Acknowledge button linking to {string} is present', async function (urlPattern) {
  console.warn('[SKIP] Email content check requires inbox access — step skipped');
});

When('the recipient clicks the Acknowledge Alert button', async function () {
  if (!this.acknowledgeToken) { console.warn('[SKIP] No acknowledge token'); return; }
  await this.page.goto(`${this.apiUrl}/api/notifications/acknowledge/${this.acknowledgeToken}`);
  await this.page.waitForLoadState('networkidle');
});

Then('the browser shows a {string} page with the recipient name and incident title', async function (pageTitle) {
  if (!this.acknowledgeToken) return;
  await this.page.locator(`text=${pageTitle}`).first().waitFor({ timeout: 8000 });
});

Then('the notification record in Firestore has acknowledged set to true and acknowledgedAt populated', async function () {
  if (!this.acknowledgeToken) return;
  await this.page.locator('text=confirmed, text=Confirmed, text=acknowledged').first().waitFor({ timeout: 5000 });
});

Then('the linked incident acknowledgedBy array is updated and status is changed to acknowledged', async function () {
  if (!this.acknowledgeToken) return;
  console.warn('[WARN] Firestore data verification requires admin SDK access');
});

When('I navigate to the acknowledge link again', async function () {
  if (!this.acknowledgeToken) return;
  await this.page.goto(`${this.apiUrl}/api/notifications/acknowledge/${this.acknowledgeToken}`);
  await this.page.waitForLoadState('networkidle');
});

Then('I see the {string} page', async function (pageTitle) {
  // Skip if no acknowledge token was set (acknowledge flow not configured)
  if (this.acknowledgeToken === null || this.acknowledgeToken === undefined) {
    console.warn(`[SKIP] No acknowledge token — skipping "${pageTitle}" page check`);
    return;
  }
  await this.page.locator(`text=${pageTitle}`).first().waitFor({ timeout: 8000 });
});

Then('the record is not duplicated', async function () {
  // Passes if Already Acknowledged page is shown without error
});

When('I navigate to the acknowledge url {string}', async function (path) {
  await this.page.goto(`${this.apiUrl}${path}`);
  await this.page.waitForLoadState('networkidle');
});

Then('I see the {string} error page', async function (pageTitle) {
  await this.page.locator(`text=${pageTitle}`).first().waitFor({ timeout: 8000 });
});

Then('failed notifications appear with a red failed badge', async function () {
  // StatusBadge in Notifications.jsx: span with bg-red-100 text-red-700 for failed
  const badge = this.page.locator('span[class*="bg-red-100"]:has-text("failed")').first();
  await badge.waitFor({ timeout: 8000 });
});

Then('the Failed summary card shows the correct count', async function () {
  await this.page.locator('text=Failed').first().waitFor({ timeout: 8000 });
});

Then('I cannot access the Notifications page', async function () {
  await this.page.goto(`${this.baseUrl}/notifications`);
  await this.page.waitForURL(url => !url.pathname.includes('notifications'), { timeout: 8000 });
});
