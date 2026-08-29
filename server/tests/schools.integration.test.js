const test = require('node:test')
const assert = require('node:assert/strict')

// ── In-memory Firestore double ────────────────────────────────────────────────
// Mirrors the fake used by setup.integration.test.js, extended with the
// operations schoolService relies on: .create(), .set(), auto-generated IDs,
// doc refs on query results, and write batches.

let stores = {}
let autoIdCounter = 1

function getStore(name) {
  if (!stores[name]) stores[name] = new Map()
  return stores[name]
}

function makeDoc(collectionName, id, data) {
  return {
    id,
    exists: Boolean(data),
    data: () => (data ? { ...data } : undefined),
    ref: makeDocRef(collectionName, id),
  }
}

function makeDocRef(collectionName, id) {
  const store = getStore(collectionName)

  return {
    id,
    _collection: collectionName,
    async get() {
      return makeDoc(collectionName, id, store.get(id))
    },
    async create(data) {
      if (store.has(id)) {
        const err = new Error(`Document already exists: ${id}`)
        err.code = 6
        throw err
      }
      store.set(id, { ...data })
    },
    async set(data, options = {}) {
      const existing = options.merge ? store.get(id) || {} : {}
      store.set(id, { ...existing, ...data })
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
}

function makeQuery(collectionName, filters) {
  const store = getStore(collectionName)

  return {
    where(field, op, value) {
      return makeQuery(collectionName, [...filters, { field, op, value }])
    },
    async get() {
      const docs = [...store.entries()]
        .filter(([, record]) =>
          filters.every(f => (f.op === '==' ? record[f.field] === f.value : false))
        )
        .map(([id, record]) => makeDoc(collectionName, id, record))

      return { docs, empty: docs.length === 0, size: docs.length }
    },
  }
}

function makeCollection(collectionName) {
  const store = getStore(collectionName)

  return {
    where(field, op, value) {
      return makeQuery(collectionName, []).where(field, op, value)
    },
    async get() {
      const docs = [...store.entries()].map(([id, record]) => makeDoc(collectionName, id, record))
      return { docs, empty: docs.length === 0, size: docs.length }
    },
    // Called with no argument to mint an ID (the non-Latin-name fallback).
    doc(id) {
      return makeDocRef(collectionName, id ?? `auto_${autoIdCounter++}`)
    },
  }
}

const fakeDb = {
  collection: makeCollection,
  batch() {
    const operations = []
    return {
      update(ref, data) {
        operations.push({ ref, data })
      },
      async commit() {
        for (const { ref, data } of operations) {
          await ref.update(data)
        }
      },
    }
  },
}

// ── Wire the double in before loading the service ─────────────────────────────

const firebasePath = require.resolve('../src/db/firebase')

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

const servicePath = require.resolve('../src/services/schoolService')
delete require.cache[servicePath]

const schoolService = require(servicePath)
const { resetSchoolCache } = require('../src/schoolCache')

// ── Fixtures ──────────────────────────────────────────────────────────────────

function seed({ schools = {}, incidents = {}, ...rest } = {}) {
  stores = {}
  autoIdCounter = 1
  resetSchoolCache()

  Object.entries({ schools, incidents, ...rest }).forEach(([collectionName, records]) => {
    const store = getStore(collectionName)
    Object.entries(records).forEach(([id, record]) => store.set(id, { ...record }))
  })
}

const BASE_SCHOOLS = {
  school_alpha: { name: 'Alpha School', active: true },
  school_beta: { name: 'Beta School', active: true },
}

// ── listSchoolsForProfile ─────────────────────────────────────────────────────

test('lists every school for a Company Admin', async () => {
  seed({ schools: BASE_SCHOOLS })

  const result = await schoolService.listSchoolsForProfile({ role: 'Company Admin' })
  assert.deepEqual(result.map(s => s.id), ['school_alpha', 'school_beta'])
})

test('lists only the caller school for a School Admin', async () => {
  seed({ schools: BASE_SCHOOLS })

  const result = await schoolService.listSchoolsForProfile({
    role: 'School Admin',
    schoolId: 'school_beta',
  })
  assert.deepEqual(result.map(s => s.id), ['school_beta'])
})

test('does not leak other schools to a School Admin', async () => {
  seed({ schools: BASE_SCHOOLS })

  const result = await schoolService.listSchoolsForProfile({
    role: 'School Admin',
    schoolId: 'school_beta',
  })
  assert.equal(result.some(s => s.id === 'school_alpha'), false)
})

test('returns schools sorted by name regardless of insertion order', async () => {
  seed({
    schools: {
      school_zulu: { name: 'Zulu School', active: true },
      school_alpha: { name: 'Alpha School', active: true },
      school_mike: { name: 'Mike School', active: true },
    },
  })

  const result = await schoolService.listSchools()
  assert.deepEqual(result.map(s => s.name), ['Alpha School', 'Mike School', 'Zulu School'])
})

test('includes schools that have no createdAt field', async () => {
  // Regression guard: an orderBy('createdAt') query would silently drop these.
  seed({
    schools: {
      school_alpha: { name: 'Alpha School', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
      school_nodate: { name: 'No Date School', active: true },
    },
  })

  const result = await schoolService.listSchools()
  assert.equal(result.length, 2)
  assert.equal(result.some(s => s.id === 'school_nodate'), true)
})

test('excludes inactive schools by default and includes them on request', async () => {
  seed({
    schools: {
      ...BASE_SCHOOLS,
      school_closed: { name: 'Closed School', active: false },
    },
  })

  assert.equal((await schoolService.listSchools()).length, 2)
  assert.equal((await schoolService.listSchools({ includeInactive: true })).length, 3)
})

// ── getSchoolName ─────────────────────────────────────────────────────────────

test('resolves a school name by id', async () => {
  seed({ schools: BASE_SCHOOLS })
  assert.equal(await schoolService.getSchoolName('school_beta'), 'Beta School')
})

test('returns null for an unknown or missing school id', async () => {
  seed({ schools: BASE_SCHOOLS })
  assert.equal(await schoolService.getSchoolName('school_nope'), null)
  assert.equal(await schoolService.getSchoolName(null), null)
  assert.equal(await schoolService.getSchoolName(undefined), null)
})

// ── createSchool ──────────────────────────────────────────────────────────────

test('creates a school with a slugified id and active default', async () => {
  seed({ schools: {} })

  const school = await schoolService.createSchool({ name: 'Bunbury Senior High' })

  assert.equal(school.id, 'school_bunbury_senior_high')
  assert.equal(school.name, 'Bunbury Senior High')
  assert.equal(school.active, true)
  assert.ok(school.createdAt)
})

test('a newly created school appears in the list immediately', async () => {
  seed({ schools: BASE_SCHOOLS })

  await schoolService.createSchool({ name: 'Gamma School' })
  const result = await schoolService.listSchools()

  // Proves the cache is invalidated on write the core of "new schools appear
  // in all dropdowns immediately".
  assert.equal(result.length, 3)
  assert.equal(result.some(s => s.name === 'Gamma School'), true)
})

test('rejects a duplicate name regardless of case and spacing', async () => {
  seed({ schools: BASE_SCHOOLS })

  await assert.rejects(
    () => schoolService.createSchool({ name: '  alpha   SCHOOL ' }),
    err => err.status === 409 && err.code === 'duplicate_name'
  )
})

test('rejects an invalid name', async () => {
  seed({ schools: {} })

  await assert.rejects(
    () => schoolService.createSchool({ name: '  ' }),
    err => err.status === 400 && err.code === 'invalid_name'
  )
})

test('suffixes the id when two different names slugify identically', async () => {
  seed({ schools: {} })

  const first = await schoolService.createSchool({ name: 'St Marys College' })
  const second = await schoolService.createSchool({ name: "St. Mary's College" })

  assert.equal(first.id, 'school_st_marys_college')
  assert.equal(second.id, 'school_st_marys_college_2')
})

test('falls back to a generated id when the name yields no slug', async () => {
  seed({ schools: {} })

  const school = await schoolService.createSchool({ name: '北京学校' })

  assert.ok(school.id)
  assert.equal(school.name, '北京学校')
  assert.equal((await schoolService.listSchools()).length, 1)
})

// ── renameSchool ──────────────────────────────────────────────────────────────

test('rename propagates schoolName to every denormalised collection', async () => {
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: true } },
    users: {
      u1: { email: 'a@b.c', schoolId: 'school_alpha', schoolName: 'Alpha School' },
      u2: { email: 'd@e.f', schoolId: 'school_beta', schoolName: 'Beta School' },
    },
    incidents: {
      i1: { schoolId: 'school_alpha', schoolName: 'Alpha School', status: 'resolved' },
    },
    archivedIncidents: {
      a1: { schoolId: 'school_alpha', schoolName: 'Alpha School' },
    },
    notifications: {
      n1: { schoolId: 'school_alpha', schoolName: 'Alpha School' },
    },
    notificationRecipients: {
      r1: { schoolId: 'school_alpha', schoolName: 'Alpha School' },
    },
    notificationRouting: {
      x1: { schoolId: 'school_alpha', schoolName: 'Alpha School' },
    },
  })

  const result = await schoolService.renameSchool('school_alpha', { name: 'Alpha Primary' })

  assert.equal(result.changed, true)
  assert.equal(result.school.name, 'Alpha Primary')

  for (const collectionName of schoolService.DENORMALISED_COLLECTIONS) {
    assert.equal(result.propagated[collectionName], 1, `${collectionName} should have 1 update`)
  }

  assert.equal(getStore('users').get('u1').schoolName, 'Alpha Primary')
  assert.equal(getStore('incidents').get('i1').schoolName, 'Alpha Primary')
  assert.equal(getStore('archivedIncidents').get('a1').schoolName, 'Alpha Primary')
  assert.equal(getStore('notifications').get('n1').schoolName, 'Alpha Primary')
  assert.equal(getStore('notificationRecipients').get('r1').schoolName, 'Alpha Primary')
  assert.equal(getStore('notificationRouting').get('x1').schoolName, 'Alpha Primary')
})

test('rename does not touch records belonging to another school', async () => {
  seed({
    schools: BASE_SCHOOLS,
    users: {
      u1: { schoolId: 'school_alpha', schoolName: 'Alpha School' },
      u2: { schoolId: 'school_beta', schoolName: 'Beta School' },
    },
  })

  await schoolService.renameSchool('school_alpha', { name: 'Alpha Primary' })

  assert.equal(getStore('users').get('u2').schoolName, 'Beta School')
})

test('rename does not rewrite the updatedAt of incidents', async () => {
  // Bumping updatedAt would make a rename look like incident activity and skew
  // the response-time analytics.
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: true } },
    incidents: {
      i1: {
        schoolId: 'school_alpha',
        schoolName: 'Alpha School',
        status: 'resolved',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  })

  await schoolService.renameSchool('school_alpha', { name: 'Alpha Primary' })

  assert.equal(getStore('incidents').get('i1').updatedAt, '2026-01-01T00:00:00.000Z')
})

test('rename to the identical name is a no-op', async () => {
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: true } },
    users: { u1: { schoolId: 'school_alpha', schoolName: 'Alpha School' } },
  })

  const result = await schoolService.renameSchool('school_alpha', { name: 'Alpha School' })

  assert.equal(result.changed, false)
  assert.deepEqual(result.propagated, {})
})

test('rename normalises whitespace before saving', async () => {
  seed({ schools: { school_alpha: { name: 'Alpha School', active: true } } })

  const result = await schoolService.renameSchool('school_alpha', { name: '  Alpha   Primary  ' })
  assert.equal(result.school.name, 'Alpha Primary')
})

test('rename rejects a name already used by another school', async () => {
  seed({ schools: BASE_SCHOOLS })

  await assert.rejects(
    () => schoolService.renameSchool('school_alpha', { name: 'Beta School' }),
    err => err.status === 409 && err.code === 'duplicate_name'
  )
})

test('rename rejects an unknown school', async () => {
  seed({ schools: BASE_SCHOOLS })

  await assert.rejects(
    () => schoolService.renameSchool('school_nope', { name: 'Whatever School' }),
    err => err.status === 404 && err.code === 'not_found'
  )
})

test('rename rejects an invalid name', async () => {
  seed({ schools: BASE_SCHOOLS })

  await assert.rejects(
    () => schoolService.renameSchool('school_alpha', { name: 'A' }),
    err => err.status === 400 && err.code === 'invalid_name'
  )
})

test('renamed school keeps its id so existing references stay valid', async () => {
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: true } },
    incidents: { i1: { schoolId: 'school_alpha', schoolName: 'Alpha School', status: 'resolved' } },
  })

  await schoolService.renameSchool('school_alpha', { name: 'Completely Different Name' })

  assert.equal(getStore('incidents').get('i1').schoolId, 'school_alpha')
  assert.ok(getStore('schools').get('school_alpha'))
})

// ── setSchoolActive ───────────────────────────────────────────────────────────

test('deactivates a school with no open incidents', async () => {
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: true } },
    incidents: { i1: { schoolId: 'school_alpha', status: 'resolved' } },
  })

  const school = await schoolService.setSchoolActive('school_alpha', false)

  assert.equal(school.active, false)
  assert.equal((await schoolService.listSchools()).length, 0)
})

test('refuses to deactivate a school with an open incident', async () => {
  for (const status of schoolService.ACTIVE_INCIDENT_STATUSES) {
    seed({
      schools: { school_alpha: { name: 'Alpha School', active: true } },
      incidents: { i1: { schoolId: 'school_alpha', status } },
    })

    await assert.rejects(
      () => schoolService.setSchoolActive('school_alpha', false),
      err => err.status === 409 && err.code === 'has_active_incidents',
      `status "${status}" should block deactivation`
    )
  }
})

test('open incidents at another school do not block deactivation', async () => {
  seed({
    schools: BASE_SCHOOLS,
    incidents: { i1: { schoolId: 'school_beta', status: 'triggered' } },
  })

  const school = await schoolService.setSchoolActive('school_alpha', false)
  assert.equal(school.active, false)
})

test('reactivating is always allowed and restores visibility', async () => {
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: false } },
    incidents: { i1: { schoolId: 'school_alpha', status: 'triggered' } },
  })

  const school = await schoolService.setSchoolActive('school_alpha', true)

  assert.equal(school.active, true)
  assert.equal((await schoolService.listSchools()).length, 1)
})

test('setSchoolActive rejects a non-boolean and an unknown school', async () => {
  seed({ schools: BASE_SCHOOLS })

  await assert.rejects(
    () => schoolService.setSchoolActive('school_alpha', 'yes'),
    err => err.status === 400
  )
  await assert.rejects(
    () => schoolService.setSchoolActive('school_nope', false),
    err => err.status === 404
  )
})

test('deactivating a school never deletes it or its incidents', async () => {
  seed({
    schools: { school_alpha: { name: 'Alpha School', active: true } },
    incidents: { i1: { schoolId: 'school_alpha', status: 'resolved' } },
  })

  await schoolService.setSchoolActive('school_alpha', false)

  assert.ok(getStore('schools').get('school_alpha'), 'school document must survive')
  assert.ok(getStore('incidents').get('i1'), 'incident must survive')
})
