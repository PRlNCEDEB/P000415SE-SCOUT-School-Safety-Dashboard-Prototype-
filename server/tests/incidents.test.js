const test = require('node:test')
const assert = require('node:assert/strict')

const { getSortValue, toIncidentResponse } = require('../src/routes/incidents')

test('getSortValue returns 0 when no timestamp fields exist', () => {
  assert.equal(getSortValue({}), 0)
})

test('getSortValue prefers Firestore-style toMillis values', () => {
  const value = getSortValue({
    createdAt: {
      toMillis() {
        return 123456
      },
    },
  })

  assert.equal(value, 123456)
})

test('getSortValue parses ISO date strings', () => {
  const iso = '2026-04-29T10:00:00.000Z'
  assert.equal(getSortValue({ createdAt: iso }), Date.parse(iso))
})

test('toIncidentResponse applies defaults for missing incident fields', () => {
  const response = toIncidentResponse({ id: 7 })

  assert.equal(response.id, '7')
  assert.equal(response.type, 'general')
  assert.equal(response.priority, 'low')
  assert.equal(response.status, 'triggered')
  assert.equal(response.title, 'Untitled incident')
  assert.equal(response.location, 'Unknown location')
  assert.equal(response.createdAt, null)
  assert.equal(response.updatedAt, null)
  assert.equal(response.triggeredByName, 'Unknown reporter')
  assert.equal(response.triggeredById, null)
  assert.equal(response.triggeredByEmail, null)
  assert.equal(response.triggeredByRole, null)
  assert.equal(response.schoolId, null)
  assert.equal(response.schoolName, null)
  assert.deepEqual(response.assignedUserIds, [])
  assert.deepEqual(response.assignedUserEmails, [])
  assert.equal(response.description, '')
  assert.deepEqual(response.acknowledgedBy, [])
  assert.deepEqual(response.inProgressBy, [])
  assert.deepEqual(response.notifications, [])
  assert.equal(response.timestamp, '')
})

test('toIncidentResponse preserves provided incident values', () => {
  const createdAt = {
    toDate() {
      return new Date('2026-04-29T11:15:00.000Z')
    },
  }

  const response = toIncidentResponse({
    id: 'incident-42',
    type: 'fire',
    priority: 'critical',
    status: 'acknowledged',
    title: 'Fire alarm triggered',
    location: 'Block B',
    createdAt,
    triggeredByName: 'Admin User',
    triggeredById: 'admin-uid',
    triggeredByEmail: 'admin@school.edu',
    triggeredByRole: 'companyAdmin',
    schoolId: 'school_alpha',
    schoolName: 'Alpha School',
    assignedUserIds: ['staff-uid'],
    assignedUserEmails: ['staff@school.edu'],
    description: 'Smoke detected near science lab.',
    acknowledgedBy: [{ name: 'Riley Principal' }],
    inProgressBy: [{ name: 'School Admin' }],
  })

  assert.equal(response.id, 'incident-42')
  assert.equal(response.type, 'fire')
  assert.equal(response.priority, 'critical')
  assert.equal(response.status, 'acknowledged')
  assert.equal(response.title, 'Fire alarm triggered')
  assert.equal(response.location, 'Block B')
  assert.equal(response.createdAt, '2026-04-29T11:15:00.000Z')
  assert.equal(response.triggeredByName, 'Admin User')
  assert.equal(response.triggeredById, 'admin-uid')
  assert.equal(response.triggeredByEmail, 'admin@school.edu')
  assert.equal(response.triggeredByRole, 'companyAdmin')
  assert.equal(response.schoolId, 'school_alpha')
  assert.equal(response.schoolName, 'Alpha School')
  assert.deepEqual(response.assignedUserIds, ['staff-uid'])
  assert.deepEqual(response.assignedUserEmails, ['staff@school.edu'])
  assert.equal(response.description, 'Smoke detected near science lab.')
  assert.deepEqual(response.acknowledgedBy, [{ name: 'Riley Principal' }])
  assert.deepEqual(response.inProgressBy, [{ name: 'School Admin' }])
  assert.deepEqual(response.notifications, [])
  assert.equal(typeof response.timestamp, 'string')
  assert.notEqual(response.timestamp, '')
})
