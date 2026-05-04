const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

let fakeDb
let nextIncidentId = 1

function makeDoc(id, data) {
  return {
    id,
    exists: !!data,
    data: () => data,
  }
}

function createTestDb({ incidents = {}, notifications = {} } = {}) {
  const incidentStore = new Map(Object.entries(incidents).map(([id, value]) => [id, { ...value }]))
  const notificationStore = new Map(Object.entries(notifications).map(([id, value]) => [id, { ...value }]))

  function makeQuery(store, filters = []) {
    return {
      where(field, operator, value) {
        return makeQuery(store, [...filters, { field, operator, value }])
      },
      async get() {
        const docs = [...store.entries()]
          .filter(([, record]) => filters.every(filter => {
            if (filter.operator !== '==') return false
            return record[filter.field] === filter.value
          }))
          .map(([id, record]) => makeDoc(id, record))

        return { docs }
      },
    }
  }

  return {
    collection(name) {
      if (name === 'incidents') {
        return {
          async get() {
            return { docs: [...incidentStore.entries()].map(([id, record]) => makeDoc(id, record)) }
          },
          doc(id) {
            return {
              async get() {
                return makeDoc(id, incidentStore.get(id))
              },
              async update(data) {
                const existing = incidentStore.get(id)
                if (!existing) {
                  throw new Error(`Incident ${id} not found`)
                }
                incidentStore.set(id, { ...existing, ...data })
              },
            }
          },
          async add(data) {
            const id = `incident-${nextIncidentId++}`
            incidentStore.set(id, { ...data })
            return {
              id,
              async get() {
                return makeDoc(id, incidentStore.get(id))
              },
            }
          },
        }
      }

      if (name === 'notifications') {
        return makeQuery(notificationStore)
      }

      throw new Error(`Unexpected collection: ${name}`)
    },
    stores: {
      incidents: incidentStore,
      notifications: notificationStore,
    },
  }
}

const firebasePath = require.resolve('../src/db/firebase')
const incidentsRoutePath = require.resolve('../src/routes/incidents')

require.cache[firebasePath] = {
  id: firebasePath,
  filename: firebasePath,
  loaded: true,
  exports: {
    getDb: () => fakeDb,
    docToObject: doc => (doc && doc.exists ? { id: doc.id, ...doc.data() } : null),
    snapshotToArray: snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    formatTimestamp: value => {
      const date = value && typeof value.toDate === 'function' ? value.toDate() : new Date(value)
      return date.toISOString()
    },
  },
}


delete require.cache[incidentsRoutePath]
const incidentsRouter = require('../src/routes/incidents')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/incidents', incidentsRouter)
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
    const address = server.address()
    const baseUrl = `http://127.0.0.1:${address.port}`
    await callback(baseUrl)
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()))
    })
  }
}

test.beforeEach(() => {
  nextIncidentId = 1
})

test('GET /api/incidents returns incidents sorted newest first', async () => {
  fakeDb = createTestDb({
    incidents: {
      older: {
        title: 'Older incident',
        status: 'triggered',
        createdAt: '2026-04-29T08:00:00.000Z',
      },
      newer: {
        title: 'Newer incident',
        status: 'acknowledged',
        createdAt: '2026-04-29T09:00:00.000Z',
      },
    },
  })

  await withServer(createApp(), async baseUrl => {
    const response = await fetch(`${baseUrl}/api/incidents`)
    assert.equal(response.status, 200)

    const payload = await response.json()
    assert.equal(payload.incidents.length, 2)
    assert.equal(payload.incidents[0].id, 'newer')
    assert.equal(payload.incidents[1].id, 'older')
  })
})

test('GET /api/incidents/:id returns incident details and related notifications', async () => {
  fakeDb = createTestDb({
    incidents: {
      incident42: {
        title: 'Fire alarm triggered',
        type: 'fire',
        priority: 'critical',
        status: 'acknowledged',
        location: 'Block B',
        createdAt: '2026-04-29T10:00:00.000Z',
        triggeredByName: 'Admin User',
        description: 'Smoke detected near science lab.',
      },
    },
    notifications: {
      note1: {
        incidentId: 'incident42',
        recipientName: 'Riley Principal',
        smsStatus: 'sent',
        emailStatus: 'delivered',
      },
    },
  })

  await withServer(createApp(), async baseUrl => {
    const response = await fetch(`${baseUrl}/api/incidents/incident42`)
    assert.equal(response.status, 200)

    const payload = await response.json()
    assert.equal(payload.incident.id, 'incident42')
    assert.equal(payload.incident.title, 'Fire alarm triggered')
    assert.equal(payload.incident.notifications.length, 1)
    assert.deepEqual(payload.incident.notifications[0], {
      recipientName: 'Riley Principal',
      sms: 'sent',
      email: 'delivered',
    })
  })
})

test('POST /api/incidents creates a new incident', async () => {
  fakeDb = createTestDb()

  await withServer(createApp(), async baseUrl => {
    const response = await fetch(`${baseUrl}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'fire',
        priority: 'critical',
        title: 'Fire alert',
        location: 'Block B',
        description: 'Smoke detected',
        triggeredByName: 'Admin User',
      }),
    })

    assert.equal(response.status, 201)

    const payload = await response.json()
    assert.equal(payload.type, 'fire')
    assert.equal(payload.priority, 'critical')
    assert.equal(payload.status, 'triggered')

    const storedIncident = fakeDb.stores.incidents.get(payload.id)
    assert.equal(storedIncident.title, 'Fire alert')
    assert.equal(storedIncident.location, 'Block B')
  })
})

test('PATCH /api/incidents/:id/status updates incident status', async () => {
  fakeDb = createTestDb({
    incidents: {
      incident77: {
        title: 'Medical alert',
        status: 'triggered',
        createdAt: '2026-04-29T10:30:00.000Z',
        updatedAt: '2026-04-29T10:30:00.000Z',
      },
    },
  })

  await withServer(createApp(), async baseUrl => {
    const response = await fetch(`${baseUrl}/api/incidents/incident77/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })

    assert.equal(response.status, 200)

    const payload = await response.json()
    assert.deepEqual(payload, { success: true })

    const updated = fakeDb.stores.incidents.get('incident77')
    assert.equal(updated.status, 'resolved')
    assert.equal(typeof updated.updatedAt, 'string')
  })
})
