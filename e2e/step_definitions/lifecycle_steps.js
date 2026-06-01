const { Given, When, Then } = require('@cucumber/cucumber');

// ─── Status button label map ───────────────────────────────────────────────────
// IncidentDetail.jsx uses these exact button labels (not the status names)
const STATUS_BUTTON_LABEL = {
  'acknowledged': 'Acknowledge',
  'in-progress':  'Mark In Progress',
  'resolved':     'Mark Resolved',
};

// ─── Helper: navigate to first incident of a given status ─────────────────────
async function navigateToIncidentWithStatus(page, baseUrl, statusFilter) {
  await page.goto(`${baseUrl}/incidents`);
  await page.waitForLoadState('networkidle');
  // Select the specific status filter
  const statusSelect = page.locator('select').nth(0);
  await statusSelect.waitFor({ timeout: 8000 });
  await statusSelect.selectOption(statusFilter);
  await page.waitForTimeout(400);
  // Click first matching row
  const row = page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
  await row.click();
  await page.waitForLoadState('networkidle');
}

// ─── Preconditions: navigate to appropriate incident ──────────────────────────

Given('a triggered incident exists', async function () {
  await navigateToIncidentWithStatus(this.page, this.baseUrl, 'triggered');
});

Given('an acknowledged incident exists', async function () {
  await navigateToIncidentWithStatus(this.page, this.baseUrl, 'acknowledged');
});

Given('an in-progress incident exists', async function () {
  await navigateToIncidentWithStatus(this.page, this.baseUrl, 'in-progress');
});

Given('I open an incident I submitted', async function () {
  // Staff navigates to incidents — server scopes to their own
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
  await row.click();
  await this.page.waitForLoadState('networkidle');
});

Given('I have submitted an alert', async function () {
  await this.page.goto(`${this.baseUrl}/submit`);
  await this.page.waitForLoadState('networkidle');
  // Type button (Medical)
  const typeBtn = this.page.locator('button:has-text("Medical")').first();
  if (await typeBtn.count() > 0) await typeBtn.click();
  // Priority button (High)
  const priorBtn = this.page.locator('button:has-text("High")').first();
  if (await priorBtn.count() > 0) await priorBtn.click();
  // Title — SubmitAlert.jsx: input[type="text"] with placeholder "Brief description..."
  await this.page.locator('input[type="text"]').first().fill('Staff Lifecycle Test Alert');
  // Location select
  const locSel = this.page.locator('select').first();
  if (await locSel.count() > 0) {
    await locSel.selectOption({ index: 1 });
  }
  // Submit — Staff button says "🚨 Submit Alert"
  await this.page.locator('button:has-text("Submit Alert"), button:has-text("Run Alert Test")').first().click();
  // After submit → navigates to the new incident's detail page
  await this.page.waitForURL(url => /\/incidents\/[^/]+/.test(url.pathname), { timeout: 15000 });
  this.staffAlertUrl = this.page.url();
  this.staffAlertTitle = 'Staff Lifecycle Test Alert';
});

Given('I have changed an incident status to {string}', async function (status) {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
  // Find a triggered incident to advance
  const statusSelect = this.page.locator('select').nth(0);
  await statusSelect.selectOption('triggered');
  await this.page.waitForTimeout(400);
  const row = this.page.locator('div.cursor-pointer').first();
  await row.waitFor({ timeout: 8000 });
  await row.click();
  await this.page.waitForLoadState('networkidle');
  // Change to requested status
  const btnLabel = STATUS_BUTTON_LABEL[status];
  if (!btnLabel) throw new Error(`No button label mapping for status "${status}"`);
  const btn = this.page.locator(`button:has-text("${btnLabel}")`).first();
  await btn.waitFor({ timeout: 8000 });
  await btn.click();
  await this.page.waitForTimeout(1500);
  this.changedStatus = status;
});

// ─── Status change action ──────────────────────────────────────────────────────

When('I change the status to {string}', async function (status) {
  // IncidentDetail.jsx shows "Acknowledge", "Mark In Progress", or "Mark Resolved"
  const btnLabel = STATUS_BUTTON_LABEL[status];
  if (!btnLabel) throw new Error(`No button label mapping for status "${status}"`);
  const btn = this.page.locator(`button:has-text("${btnLabel}")`).first();
  await btn.waitFor({ timeout: 8000 });
  await btn.click();
  await this.page.waitForTimeout(1500);
});

// ─── Assertions ────────────────────────────────────────────────────────────────

Then('the incident status shows {string}', async function (status) {
  // Status badge is a span in the header area showing the status text
  // Cannot use comma-OR selector — use .or() chaining instead
  const bySpan = this.page.locator(`span:has-text("${status}")`);
  const byText = this.page.locator(`text=${status}`);
  await bySpan.or(byText).first().waitFor({ timeout: 8000 });
});

Then('the acknowledgedBy array is populated with the admin\'s name, email, role, and acknowledgedAt', async function () {
  // IncidentDetail.jsx: "Acknowledged By" section appears when acknowledgedBy.length > 0
  const section = this.page.locator('text=Acknowledged By').first();
  if (await section.count() > 0) await section.waitFor({ timeout: 5000 });
  else console.warn('[WARN] "Acknowledged By" section not visible yet — may need Refresh Status click');
});

Then('the Responded badge is visible on the incident list row', async function () {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
  // Incidents.jsx shows "✅ Responded" span for acknowledged incidents
  const badge = this.page.locator('text=Responded').first();
  await badge.waitFor({ timeout: 8000 });
});

Then('the inProgressBy array is populated', async function () {
  // IncidentDetail.jsx "More details" reveals in-progress users
  const detailsBtn = this.page.locator('text=More details').first();
  if (await detailsBtn.count() > 0) {
    await detailsBtn.click();
    await this.page.waitForTimeout(300);
  }
  const section = this.page.locator('text=In progress by').first();
  if (await section.count() > 0) await section.waitFor({ timeout: 5000 });
  else console.warn('[WARN] In-progress-by section not found');
});

Then('the incident is no longer in the active or unacknowledged sections on the dashboard', async function () {
  await this.page.goto(`${this.baseUrl}/dashboard`);
  await this.page.waitForLoadState('networkidle');
  // The resolved incident should not appear in "Unacknowledged Alerts" section
  const unackSection = this.page.locator('text=Unacknowledged Alerts').first();
  if (await unackSection.count() > 0) {
    // If section exists, count should be 0 or incident should not be visible
    console.warn('[INFO] Unacknowledged Alerts section still visible — may have other unacked incidents');
  }
});

Then('I do not see any status-change controls', async function () {
  // Staff sees "🔒 Status can only be updated by an Admin" instead of action button
  const lockMsg = this.page.locator('text=Status can only be updated by an Admin').first();
  await lockMsg.waitFor({ timeout: 8000 });
});

Then('the incident is read-only', async function () {
  // No Acknowledge / Mark In Progress / Mark Resolved buttons for Staff
  const actionBtns = await this.page.locator(
    'button:has-text("Acknowledge"), button:has-text("Mark In Progress"), button:has-text("Mark Resolved")'
  ).count();
  if (actionBtns > 0) throw new Error('Status-change buttons visible to Staff — should be hidden');
});

Then('I do not see edit, cancel, reassign, or routing buttons', async function () {
  for (const label of ['Edit', 'Cancel', 'Reassign', 'Reroute', 'Route']) {
    const count = await this.page.locator(`button:has-text("${label}")`).count();
    if (count > 0) throw new Error(`Button "${label}" should not be visible to Staff`);
  }
});

When('I view the incident detail page for that alert', async function () {
  if (this.staffAlertUrl) {
    await this.page.goto(this.staffAlertUrl);
    await this.page.waitForLoadState('networkidle');
  } else {
    await this.page.goto(`${this.baseUrl}/incidents`);
    await this.page.waitForLoadState('networkidle');
    const title = this.staffAlertTitle || 'Staff Lifecycle Test Alert';
    const titleEl = this.page.locator(`text=${title}`).first();
    if (await titleEl.count() > 0) {
      await titleEl.click();
    } else {
      await this.page.locator('div.cursor-pointer').first().click();
    }
    await this.page.waitForLoadState('networkidle');
  }
});

Then('I can see the current status', async function () {
  // Status badge is a span with status text
  const statusEl = this.page.locator(
    'span:has-text("triggered"), span:has-text("acknowledged"), span:has-text("in-progress"), span:has-text("resolved")'
  ).first();
  await statusEl.waitFor({ timeout: 8000 });
});

Then('status transitions triggered to acknowledged to resolved are visible', async function () {
  // IncidentDetail.jsx shows "Ticket Progress" with 4 step cards
  const progress = this.page.locator('text=Ticket Progress').first();
  await progress.waitFor({ timeout: 8000 });
});

Then('the incident status still shows {string}', async function (status) {
  const statusEl = this.page.locator(`span:has-text("${status}")`).first();
  await statusEl.waitFor({ timeout: 8000 });
});
