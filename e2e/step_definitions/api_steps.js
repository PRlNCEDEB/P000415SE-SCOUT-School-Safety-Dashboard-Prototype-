const { Given, When, Then } = require('@cucumber/cucumber');

When('I send a POST request to {string} with type {string}, priority {string}, title {string}, location {string}, description {string}',
  async function (path, type, priority, title, location, description) {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.bearerToken ? { Authorization: `Bearer ${this.bearerToken}` } : {}),
      },
      body: JSON.stringify({ type, priority, title, location, description }),
    });
    this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) };
  }
);

Then('the response body contains role, schoolId, and name fields', async function () {
  const body = this.lastResponse.body;
  for (const field of ['role', 'schoolId', 'name']) {
    if (!(field in body)) {
      throw new Error(`Expected field "${field}" in response but got: ${JSON.stringify(body)}`);
    }
  }
});

Then('the response contains id, type {string}, priority {string}, title {string}, location {string}, status {string}, createdAt, updatedAt, and triggeredByName',
  async function (type, priority, title, location, status) {
    const body = this.lastResponse.body;
    const checks = { type, priority, title, location, status };
    for (const [key, val] of Object.entries(checks)) {
      if (body[key] !== val) {
        throw new Error(`Expected body.${key} = "${val}" but got "${body[key]}"`);
      }
    }
    for (const field of ['id', 'createdAt', 'updatedAt', 'triggeredByName']) {
      if (!body[field] && body[field] !== 0) {
        throw new Error(`Expected field "${field}" in response but got: ${JSON.stringify(body)}`);
      }
    }
  }
);

Given('I have a valid Staff Firebase ID token', async function () {
  const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDIMFp8AKl0h4YRRIuYUIwv5MoCNVDqcTU';
  const { email, password } = this.users['Staff'];
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Firebase sign-in failed for Staff: ${err?.error?.message || res.status}`);
  }
  const data = await res.json();
  this.bearerToken = data.idToken;
});

Given('an incident exists that was not created by this staff user', async function () {
  // Get a School Admin token to create a fresh incident owned by School Admin (not Staff)
  const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDIMFp8AKl0h4YRRIuYUIwv5MoCNVDqcTU';
  const { email, password } = this.users['Beta Admin'];
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!authRes.ok) throw new Error('Could not sign in as Beta Admin to seed incident for T57');
  const { idToken } = await authRes.json();

  // Create a test incident owned by Beta Admin
  const createRes = await fetch(`${this.apiUrl}/api/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ type: 'fire', priority: 'low', title: 'T57 permission test', location: 'Test', description: 'Auto-created by T57 E2E test' }),
  });
  if (!createRes.ok) throw new Error(`Failed to create seed incident for T57: ${createRes.status}`);
  const incident = await createRes.json();
  this.targetIncidentId = incident.id;
});

When('I send a PATCH request to {string} with the Staff token', async function (pathTemplate) {
  const path = pathTemplate.replace(':id', this.targetIncidentId);
  const res = await fetch(`${this.apiUrl}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.bearerToken}`,
    },
    body: JSON.stringify({ status: 'acknowledged' }),
  });
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) };
});
