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
  this.bearerToken = process.env.STAFF_TOKEN || 'REPLACE_WITH_STAFF_TOKEN';
});

Given('an incident exists that was not created by this staff user', async function () {
  // Use a seeded incident ID
  this.targetIncidentId = process.env.SEED_INCIDENT_ID || 'seed-incident-id-placeholder';
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
