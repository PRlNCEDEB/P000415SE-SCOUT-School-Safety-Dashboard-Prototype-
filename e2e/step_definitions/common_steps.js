const { Given, When, Then } = require('@cucumber/cucumber');

// ─── Navigation helpers ────────────────────────────────────────────────────────

Given('I am on the login page', async function () {
  await this.page.goto(`${this.baseUrl}/login`);
  await this.page.waitForLoadState('networkidle');
});

Given('I am not logged in', async function () {
  // fresh context already has no cookies — nothing to do
});

Given('I am logged in as {string}', async function (role) {
  await this.login(role);
});

Given('I log in as {string}', async function (role) {
  await this.login(role);
});

When('I navigate to {string}', async function (path) {
  await this.page.goto(`${this.baseUrl}${path}`);
  await this.page.waitForLoadState('networkidle');
});

Then('I am redirected to the dashboard', async function () {
  await this.page.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/', { timeout: 8000 });
});

Then('I am redirected to {string}', async function (path) {
  await this.page.waitForURL(url => url.pathname === path, { timeout: 8000 });
});

Then('I am redirected away from {string}', async function (path) {
  await this.page.waitForURL(url => url.pathname !== path, { timeout: 8000 });
});

Then('I remain on the login page', async function () {
  const url = new URL(this.page.url());
  if (!url.pathname.includes('login')) throw new Error(`Expected to be on login page but was on ${url.pathname}`);
});

Given('I am on the Submit Alert page', async function () {
  await this.page.goto(`${this.baseUrl}/submit`);
  await this.page.waitForLoadState('networkidle');
});

When('I view the dashboard', async function () {
  await this.page.goto(`${this.baseUrl}/dashboard`);
  await this.page.waitForLoadState('networkidle');
});

When('I view the Incidents page', async function () {
  await this.page.goto(`${this.baseUrl}/incidents`);
  await this.page.waitForLoadState('networkidle');
});

When('I view the Analytics page', async function () {
  await this.page.goto(`${this.baseUrl}/analytics`);
  await this.page.waitForLoadState('networkidle');
});

When('I view the Notifications page', async function () {
  await this.page.goto(`${this.baseUrl}/notifications`);
  await this.page.waitForLoadState('networkidle');
});

When('I refresh the page', async function () {
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

When('I click the Refresh button', async function () {
  await this.page.click('button:has-text("Refresh")');
  await this.page.waitForLoadState('networkidle');
});

// ─── API helpers (raw HTTP — no browser needed) ────────────────────────────────

When('I send a GET request to {string}', async function (path) {
  const res = await fetch(`${this.apiUrl}${path}`);
  this.lastResponse = { status: res.status, body: await res.json().catch(() => res.text()) };
});

When('I send a GET request to {string} with a Bearer token', async function (path) {
  const res = await fetch(`${this.apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${this.bearerToken}` },
  });
  this.lastResponse = { status: res.status, body: await res.json().catch(() => res.text()) };
});

Then('the response status is {int}', async function (expectedStatus) {
  if (this.lastResponse.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus} but got ${this.lastResponse.status}`);
  }
});

Then('the response body contains {string} with value {string}', async function (key, value) {
  const body = this.lastResponse.body;
  if (body[key] !== value) {
    throw new Error(`Expected body.${key} = "${value}" but got "${body[key]}"`);
  }
});

Then('the response body contains a {string} field', async function (field) {
  const body = this.lastResponse.body;
  if (!(field in body)) throw new Error(`Expected field "${field}" in response body`);
});

Then('the response body contains {string}', async function (text) {
  const bodyStr = JSON.stringify(this.lastResponse.body).toLowerCase();
  if (!bodyStr.includes(text.toLowerCase())) {
    throw new Error(`Expected body to contain "${text}" but got: ${bodyStr}`);
  }
});

Given('no Authorization header is provided', async function () {
  this.bearerToken = null;
});

Given('I have a valid Firebase ID token for any demo account', async function () {
  // In a real run you'd get this from Firebase Auth REST API using demo credentials
  // For now, mark as pending — replace with real token logic when running live
  this.bearerToken = process.env.DEMO_TOKEN || 'REPLACE_WITH_REAL_TOKEN';
});

Given('I have a valid Firebase ID token', async function () {
  this.bearerToken = process.env.DEMO_TOKEN || 'REPLACE_WITH_REAL_TOKEN';
});
