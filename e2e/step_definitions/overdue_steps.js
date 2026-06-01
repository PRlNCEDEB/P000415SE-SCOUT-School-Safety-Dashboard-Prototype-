const { Given, When, Then } = require('@cucumber/cucumber');

// ─── Navigation to overdue incidents ──────────────────────────────────────────

When('I view the Incidents page filtered by triggered status', async function () {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
  await this.page.locator('select').nth(0).selectOption('triggered');
  await this.page.waitForTimeout(400);
});

When('I open the first triggered incident from the Incidents page', async function () {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
  await this.page.locator('select').nth(0).selectOption('triggered');
  await this.page.waitForTimeout(400);
  // To ensure we're opening an overdue incident (> 15 min old), find rows with the overdue badge
  // Overdue badge: span with amber styling, or text "Overdue"
  const overdueBadge = this.page.locator('span:has-text("Overdue")').first();
  const overdueRowLocator = overdueBadge.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]');
  await overdueRowLocator.waitFor({ timeout: 8000 });
  await overdueRowLocator.click();
  await this.page.waitForLoadState('networkidle');
  this.currentIncidentUrl = this.page.url();
});

// ─── Incidents list overdue assertions ────────────────────────────────────────
// Incidents.jsx: <span class="... bg-amber-100 text-amber-700 ...">⏰ Overdue</span>

Then('I see the overdue badge on at least one incident row', async function () {
  // Use .or() — cannot comma-join selectors in Playwright
  const bySpan = this.page.locator('span:has-text("Overdue")');
  const byText = this.page.locator('text=Overdue');
  await bySpan.or(byText).first().waitFor({ timeout: 8000 });
});

Then('the overdue incident row has an amber background highlight', async function () {
  // Overdue rows: div[class*="amber"] (bg-amber-50 or border-l-amber-400)
  const amberRow = this.page.locator('div[class*="amber"]').first();
  await amberRow.waitFor({ timeout: 8000 });
});

// ─── Detail page overdue banner ───────────────────────────────────────────────
// IncidentDetail.jsx: <div class="bg-amber-50 border border-amber-400 ...">

Then('I see the amber overdue warning banner', async function () {
  const banner = this.page.locator('div[class*="bg-amber-50"]').first();
  await banner.waitFor({ timeout: 8000 });
});

Then('the banner contains the text {string}', async function (text) {
  // Read the amber banner's full text content and check via .includes()
  // filter({ hasText }) can miss due to transition timing — textContent is more reliable
  const banner = this.page.locator('div[class*="bg-amber-50"]').first();
  await banner.waitFor({ timeout: 8000 });
  const content = await banner.textContent();
  if (!content || !content.includes(text)) {
    throw new Error(`Expected banner to contain "${text}" but got: "${(content || '').trim()}"`);
  }
});

// ─── Dashboard overdue indicator ──────────────────────────────────────────────
// Dashboard.jsx: <span class="... bg-amber-100 text-amber-700 ...">⏰ N overdue</span>

Then('I see the Unacknowledged Alerts section', async function () {
  await this.page.locator('text=Unacknowledged Alerts').first().waitFor({ timeout: 8000 });
});

Then('I see an overdue count indicator next to the section heading', async function () {
  // Use .or() — cannot comma-join CSS and text selectors
  const byClass = this.page.locator('span[class*="amber"]');
  const byText  = this.page.locator('text=overdue');
  await byClass.or(byText).first().waitFor({ timeout: 8000 });
});

// ─── Setup page threshold/retention edit ─────────────────────────────────────
// Setup.jsx for Company Admin: two input[type="number"] — nth(0)=threshold, nth(1)=retention

When('I set the overdue threshold to {int}', async function (value) {
  const input = this.page.locator('input[type="number"]').nth(0);
  await input.waitFor({ timeout: 8000 });
  // click({ clickCount: 3 }) selects all existing text before fill — tripleClick() not in Playwright 1.44
  await input.click({ clickCount: 3 });
  await input.fill(String(value));
  this.thresholdValue = value;
});

When('I set the retention period to {int}', async function (value) {
  const input = this.page.locator('input[type="number"]').nth(1);
  await input.waitFor({ timeout: 8000 });
  await input.click({ clickCount: 3 });
  await input.fill(String(value));
  this.retentionValue = value;
});

When('I save the global settings', async function () {
  const btn = this.page.locator('button:has-text("Save global settings")').first();
  await btn.waitFor({ timeout: 8000 });
  await btn.click();
  await this.page.waitForTimeout(1500);
});

Then('the settings are saved successfully', async function () {
  // Setup.jsx shows "Settings saved." in green text
  const successMsg = this.page.locator('text=Settings saved').first();
  await successMsg.waitFor({ timeout: 8000 });
});

Then('the overdue threshold input shows the value {int}', async function (value) {
  const input = this.page.locator('input[type="number"]').nth(0);
  await input.waitFor({ timeout: 5000 });
  const current = await input.inputValue();
  if (parseInt(current, 10) !== value) {
    throw new Error(`Expected overdue threshold ${value} but got ${current}`);
  }
});

Then('the retention period input shows the value {int}', async function (value) {
  const input = this.page.locator('input[type="number"]').nth(1);
  await input.waitFor({ timeout: 5000 });
  const current = await input.inputValue();
  if (parseInt(current, 10) !== value) {
    throw new Error(`Expected retention period ${value} but got ${current}`);
  }
});
