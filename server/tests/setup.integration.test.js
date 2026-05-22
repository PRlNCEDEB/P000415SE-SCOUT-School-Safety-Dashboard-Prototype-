const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

let fakeDb
let nextDocId = 1

function makeDoc(id, data) {
  return {
    id,
    exists: !!data,
    data: () => data,
  }
}

function createTestDb({
  alertTypes = {},
  locations = {},
  notificationRouting = {},
  users = {},
} = {}) {
  const alertTypesStore = new Map(Object.entries(alertTypes).map(([id, v]) => [id, { ...v }]))
  const locationsStore = new Map(Object.entries(locations).map(([id, v]) => [id, { ...v }]))
  const routingStore = new Map(Object.entries(notificationRouting).map(([id, v]) => [id, { ...v }]))
  const usersStore = new Map(Object.entries(users).map(([id, v]) => [id, { ...v }]))

  function makeQuery(store, filters = [], limitCount = null) {
    return {
      where(field, op, value) {
        return makeQuery(store, [...filters, { field, op, value }], limitCount)
      },
      orderBy() {
        return makeQuery(store, filters, limitCount)
      },
      limit(n) {
        return makeQuery(store, filters, n)
      },
      async get() {
        let entries = [...store.entries()].filter(([, record]) =>
          filters.every(f => {
            if (f.op === '==') return record[f.field] === f.value
            return false
          })
        )
        if (limitCount !== null) entries = entries.slice(0, limitCount)
        const docs = entries.map(([id, record]) => makeDoc(id, record))
        return { docs, empty: docs.length === 0 }
      },
    }
  }

  function makeCollection(store) {
    return {
      where(field, op, value) {
        return makeQuery(store).where(field, op, value)
      },
      orderBy() {
        return makeQuery(store)
      },
      async get() {
        const docs = [...store.entries()].map(([id, record]) => makeDoc(id, record))
        return { docs, empty: docs.length === 0 }
      },
      doc(id) {
        return {
          async get() {
            return makeDoc(id, store.get(id))
          },
          async update(data) {
            const existing = store.get(id)
            if (!existing) throw new Error(`Document ${id} not found`)
            store.set(id, { ...existing, ...data })
          },
          async delete() {
            store.delete(id)
          },
        }
      },
      async add(data) {
        const id = `doc-${nextDocId++}`
        store.set(id, { ...data })
        return {
          id,
          async get() {
            return makeDoc(id, store.get(id))
          },
        }
      },
    }
  }

  return {
    collection(name) {
      if (name === 'alertTypes') return makeCollection(alertTypesStore)
      if (name === 'locations') return makeCollection(locationsStore)
      if (name === 'notificationRouting') return makeCollection(routingStore)
      if (name === 'users') return makeCollection(usersStore)
      throw new Error(`Unexpected collection: ${name}`)
    },
    stores: {
      alertTypes: alertTypesStore,
      locations: locationsStore,
      routing: routingStore,
      users: usersStore,
    },
  }
}

// ── Mock firebase and firebase-admin ──────────────────────────────────────────

const firebasePath = require.resolve('../src/db/firebase')
const firebaseAdminPath = require.resolve('firebase-admin')
const setupRoutePath = require.resolve('../src/routes/setup')

require.cache[firebasePath] = {
  id: firebasePath,
  filename: firebasePath,
  loaded: true,
  exports: {
    getDb: () => fakeDb,
    docToObject: doc => (doc && doc.exists ? { id: doc.id, ...doc.data() } : null),
    snapshotToArray: snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    formatTimestamp: () => '',
  },
}

require.cache[firebaseAdminPath] = {
  id: firebaseAdminPath,
  filename: firebaseAdminPath,
  loaded: true,
  exports: {
    auth: () => ({
      async verifyIdToken(token) {
        const tokens = {
          'company-token': { uid: 'company-uid', email: 'company@scout.edu' },
          'school-token': { uid: 'school-uid', email: 'school@school.edu' },
          'staff-token': { uid: 'staff-uid', email: 'staff@school.edu' },
        }
        if (!tokens[token]) throw new Error('Invalid token')
        return tokens[token]
      },
    }),
  },
}

delete require.cache[setupRoutePath]
const setupRouter = require('../src/routes/setup')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/setup', setupRouter)
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || 'Internal server error.' })
  })
  return app
}

async function withServer(app, callback) {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance))
  })
  try {
    const { port } = server.address()
    await callback(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()))
    })
  }
}

const COMPANY_USER = { name: 'Company Admin', email: 'company@scout.edu', role: 'companyAdmin' }
const SCHOOL_USER = { name: 'School Admin', email: 'school@school.edu', role: 'schoolAdmin', schoolId: 'school_alpha' }
const SCHOOL_USER_NO_ID = { name: 'School Admin No ID', email: 'school@school.edu', role: 'schoolAdmin' }
const STAFF_USER = { name: 'Staff User', email: 'staff@school.edu', role: 'staff', schoolId: 'school_alpha' }

test.beforeEach(() => { nextDocId = 1 })

// ── Alert Types — happy path ──────────────────────────────────────────────────

test('GET /api/setup/alert-types returns list for any authenticated user', async () => {
  fakeDb = createTestDb({
    users: { 'staff-uid': STAFF_USER },
    alertTypes: {
      'type-1': { label: 'Fire', emoji: '🔥', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
      'type-2': { label: 'Medical', emoji: '🏥', active: true, createdAt: '2026-01-02T00:00:00.000Z' },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      headers: { Authorization: 'Bearer staff-token' },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.alertTypes.length, 2)
  })
})

test('POST /api/setup/alert-types creates alert type for company admin', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: 'Hazmat', emoji: '☣️' }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.alertType.label, 'Hazmat')
    assert.equal(data.alertType.emoji, '☣️')
    assert.equal(data.alertType.active, true)
  })
})

test('PUT /api/setup/alert-types/:id updates alert type for company admin', async () => {
  fakeDb = createTestDb({
    users: { 'company-uid': COMPANY_USER },
    alertTypes: { 'type-1': { label: 'Fire', emoji: '🔥', active: true } },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types/type-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: 'Fire Updated', emoji: '🔥' }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.alertType.label, 'Fire Updated')
  })
})

test('DELETE /api/setup/alert-types/:id deletes for company admin', async () => {
  fakeDb = createTestDb({
    users: { 'company-uid': COMPANY_USER },
    alertTypes: { 'type-1': { label: 'Fire', emoji: '🔥', active: true } },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types/type-1`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer company-token' },
    })
    assert.equal(res.status, 204)
    assert.equal(fakeDb.stores.alertTypes.has('type-1'), false)
  })
})

// ── Alert Types — access control ──────────────────────────────────────────────

test('GET /api/setup/alert-types returns 401 with no token', async () => {
  fakeDb = createTestDb({ users: {} })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`)
    assert.equal(res.status, 401)
  })
})

test('POST /api/setup/alert-types returns 403 for school admin', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({ label: 'Hazmat', emoji: '☣️' }),
    })
    assert.equal(res.status, 403)
  })
})

test('POST /api/setup/alert-types returns 403 for staff', async () => {
  fakeDb = createTestDb({ users: { 'staff-uid': STAFF_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer staff-token' },
      body: JSON.stringify({ label: 'Hazmat' }),
    })
    assert.equal(res.status, 403)
  })
})

test('DELETE /api/setup/alert-types/:id returns 403 for school admin', async () => {
  fakeDb = createTestDb({
    users: { 'school-uid': SCHOOL_USER },
    alertTypes: { 'type-1': { label: 'Fire', emoji: '🔥', active: true } },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types/type-1`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 403)
  })
})

// ── Alert Types — breaking points ─────────────────────────────────────────────

test('POST /api/setup/alert-types returns 400 if label is missing', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ emoji: '🔥' }),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.error, 'Label is required.')
  })
})

test('POST /api/setup/alert-types returns 400 for whitespace-only label', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: '   ' }),
    })
    assert.equal(res.status, 400)
  })
})

test('POST /api/setup/alert-types stores trimmed label', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: '  Fire  ' }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.alertType.label, 'Fire')
  })
})

test('POST /api/setup/alert-types handles very long label without crashing', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: 'A'.repeat(10000) }),
    })
    // Should not crash — either 201 or 400 is acceptable
    assert.ok([200, 201, 400].includes(res.status))
  })
})

test('POST /api/setup/alert-types handles special characters in label safely', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: '<script>alert("xss")</script>' }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    // Label should be stored as-is (sanitisation is the frontend's job)
    assert.equal(data.alertType.label, '<script>alert("xss")</script>')
  })
})

test('PUT /api/setup/alert-types/:id returns 404 if not found', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types/nonexistent`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: 'Fire', emoji: '🔥' }),
    })
    assert.equal(res.status, 404)
  })
})

test('DELETE /api/setup/alert-types/:id returns 404 if already deleted', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/alert-types/nonexistent`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer company-token' },
    })
    assert.equal(res.status, 404)
  })
})

// ── Locations — happy path ────────────────────────────────────────────────────

test('GET /api/setup/locations returns list for any authenticated user', async () => {
  fakeDb = createTestDb({
    users: { 'staff-uid': STAFF_USER },
    locations: {
      'loc-1': { label: 'Oval', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
      'loc-2': { label: 'Canteen', active: true, createdAt: '2026-01-02T00:00:00.000Z' },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations`, {
      headers: { Authorization: 'Bearer staff-token' },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.locations.length, 2)
  })
})

test('POST /api/setup/locations creates location for company admin', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: 'New Block' }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.location.label, 'New Block')
    assert.equal(data.location.active, true)
  })
})

test('PUT /api/setup/locations/:id updates location for company admin', async () => {
  fakeDb = createTestDb({
    users: { 'company-uid': COMPANY_USER },
    locations: { 'loc-1': { label: 'Oval', active: true } },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations/loc-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: 'Main Oval' }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.location.label, 'Main Oval')
  })
})

test('DELETE /api/setup/locations/:id deletes for company admin', async () => {
  fakeDb = createTestDb({
    users: { 'company-uid': COMPANY_USER },
    locations: { 'loc-1': { label: 'Oval', active: true } },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations/loc-1`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer company-token' },
    })
    assert.equal(res.status, 204)
    assert.equal(fakeDb.stores.locations.has('loc-1'), false)
  })
})

// ── Locations — access control & breaking points ──────────────────────────────

test('POST /api/setup/locations returns 403 for school admin', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({ label: 'New Block' }),
    })
    assert.equal(res.status, 403)
  })
})

test('POST /api/setup/locations returns 400 if label is missing', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({}),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.error, 'Label is required.')
  })
})

test('POST /api/setup/locations returns 400 for whitespace-only label', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ label: '   ' }),
    })
    assert.equal(res.status, 400)
  })
})

test('DELETE /api/setup/locations/:id returns 403 for school admin', async () => {
  fakeDb = createTestDb({
    users: { 'school-uid': SCHOOL_USER },
    locations: { 'loc-1': { label: 'Oval', active: true } },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations/loc-1`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 403)
  })
})

test('DELETE /api/setup/locations/:id returns 404 if not found', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/locations/nonexistent`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer company-token' },
    })
    assert.equal(res.status, 404)
  })
})

// ── Routing — happy path ──────────────────────────────────────────────────────

test('GET /api/setup/routing returns routing for school admin', async () => {
  fakeDb = createTestDb({
    users: { 'school-uid': SCHOOL_USER },
    notificationRouting: {
      'route-1': {
        schoolId: 'school_alpha',
        alertType: 'Fire',
        recipients: [{ name: 'John', email: 'john@school.edu', notify: 'email' }],
        active: true,
      },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing`, {
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.routing.length, 1)
    assert.equal(data.routing[0].alertType, 'Fire')
  })
})

test('PUT /api/setup/routing/:alertType creates routing for school admin', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({
        recipients: [{ name: 'John', email: 'john@school.edu', notify: 'email' }],
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.routing.alertType, 'Fire')
    assert.equal(data.routing.schoolId, 'school_alpha')
    assert.equal(data.routing.recipients.length, 1)
    assert.equal(data.routing.recipients[0].email, 'john@school.edu')
  })
})

test('PUT /api/setup/routing/:alertType updates existing routing doc', async () => {
  fakeDb = createTestDb({
    users: { 'school-uid': SCHOOL_USER },
    notificationRouting: {
      'route-1': {
        schoolId: 'school_alpha',
        alertType: 'Fire',
        recipients: [{ name: 'Old', email: 'old@school.edu', notify: 'email' }],
        active: true,
      },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({
        recipients: [{ name: 'New', email: 'new@school.edu', notify: 'both' }],
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.routing.recipients.length, 1)
    assert.equal(data.routing.recipients[0].email, 'new@school.edu')
  })
})

test('PUT /api/setup/routing/:alertType allows clearing all recipients', async () => {
  fakeDb = createTestDb({
    users: { 'school-uid': SCHOOL_USER },
    notificationRouting: {
      'route-1': {
        schoolId: 'school_alpha',
        alertType: 'Fire',
        recipients: [{ name: 'John', email: 'john@school.edu', notify: 'email' }],
        active: true,
      },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({ recipients: [] }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.routing.recipients.length, 0)
  })
})

test('PUT /api/setup/routing/:alertType handles URL-encoded alert type', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/${encodeURIComponent('Natural Disaster')}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({
        recipients: [{ name: 'Jane', email: 'jane@school.edu', notify: 'email' }],
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.routing.alertType, 'Natural Disaster')
  })
})

// ── Routing — access control ──────────────────────────────────────────────────

test('GET /api/setup/routing returns 403 for company admin', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing`, {
      headers: { Authorization: 'Bearer company-token' },
    })
    assert.equal(res.status, 403)
  })
})

test('GET /api/setup/routing returns 403 for staff', async () => {
  fakeDb = createTestDb({ users: { 'staff-uid': STAFF_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing`, {
      headers: { Authorization: 'Bearer staff-token' },
    })
    assert.equal(res.status, 403)
  })
})

test('PUT /api/setup/routing/:alertType returns 403 for company admin', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer company-token' },
      body: JSON.stringify({ recipients: [] }),
    })
    assert.equal(res.status, 403)
  })
})

test('PUT /api/setup/routing/:alertType returns 403 for staff', async () => {
  fakeDb = createTestDb({ users: { 'staff-uid': STAFF_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer staff-token' },
      body: JSON.stringify({ recipients: [] }),
    })
    assert.equal(res.status, 403)
  })
})

test('GET /api/setup/routing only returns routing for the school admin school', async () => {
  fakeDb = createTestDb({
    users: { 'school-uid': SCHOOL_USER },
    notificationRouting: {
      'route-alpha': { schoolId: 'school_alpha', alertType: 'Fire', recipients: [], active: true },
      'route-beta': { schoolId: 'school_beta', alertType: 'Fire', recipients: [], active: true },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing`, {
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.routing.length, 1)
    assert.equal(data.routing[0].schoolId, 'school_alpha')
  })
})

// ── Routing — breaking points ─────────────────────────────────────────────────

test('PUT /api/setup/routing/:alertType returns 400 if recipient has no email or phone', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({
        recipients: [{ name: 'No Contact' }],
      }),
    })
    assert.equal(res.status, 400)
  })
})

test('PUT /api/setup/routing/:alertType returns 400 if recipients is not an array', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing/Fire`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer school-token' },
      body: JSON.stringify({ recipients: 'not-an-array' }),
    })
    assert.equal(res.status, 400)
  })
})

test('GET /api/setup/routing returns 403 for school admin without schoolId', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER_NO_ID } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/routing`, {
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 403)
  })
})

// ── School Users — happy path ─────────────────────────────────────────────────

test('GET /api/setup/school-users returns users for school admin excluding self', async () => {
  fakeDb = createTestDb({
    users: {
      'school-uid': SCHOOL_USER,
      'staff-uid': { ...STAFF_USER, schoolId: 'school_alpha' },
      'other-uid': { name: 'Other School', email: 'other@beta.edu', role: 'staff', schoolId: 'school_beta' },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/school-users`, {
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.users.length, 1)
    assert.equal(data.users[0].email, 'staff@school.edu')
  })
})

test('GET /api/setup/school-users response contains name role and email fields', async () => {
  fakeDb = createTestDb({
    users: {
      'school-uid': SCHOOL_USER,
      'staff-uid': { name: 'Staff', email: 'staff@school.edu', role: 'staff', schoolId: 'school_alpha' },
    },
  })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/school-users`, {
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    const user = data.users[0]
    assert.ok('name' in user)
    assert.ok('email' in user)
    assert.ok('role' in user)
  })
})

// ── School Users — access control & breaking points ───────────────────────────

test('GET /api/setup/school-users returns 403 for company admin', async () => {
  fakeDb = createTestDb({ users: { 'company-uid': COMPANY_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/school-users`, {
      headers: { Authorization: 'Bearer company-token' },
    })
    assert.equal(res.status, 403)
  })
})

test('GET /api/setup/school-users returns 403 for staff', async () => {
  fakeDb = createTestDb({ users: { 'staff-uid': STAFF_USER } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/school-users`, {
      headers: { Authorization: 'Bearer staff-token' },
    })
    assert.equal(res.status, 403)
  })
})

test('GET /api/setup/school-users returns 403 for school admin without schoolId', async () => {
  fakeDb = createTestDb({ users: { 'school-uid': SCHOOL_USER_NO_ID } })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/school-users`, {
      headers: { Authorization: 'Bearer school-token' },
    })
    assert.equal(res.status, 403)
  })
})

test('GET /api/setup/school-users returns 401 with no token', async () => {
  fakeDb = createTestDb({ users: {} })
  await withServer(createApp(), async baseUrl => {
    const res = await fetch(`${baseUrl}/api/setup/school-users`)
    assert.equal(res.status, 401)
  })
})