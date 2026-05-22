const test = require('node:test')
const assert = require('node:assert/strict')

// Mock firebase before requiring setup.js
const firebasePath = require.resolve('../src/db/firebase')
const firebaseAdminPath = require.resolve('firebase-admin')

require.cache[firebasePath] = {
  id: firebasePath,
  filename: firebasePath,
  loaded: true,
  exports: {
    getDb: () => { throw new Error('getDb should not be called in unit tests') },
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
      async verifyIdToken() { throw new Error('not called in unit tests') },
    }),
  },
}

const setupRoutePath = require.resolve('../src/routes/setup')
delete require.cache[setupRoutePath]
const { normaliseRole } = require('../src/routes/setup')

// ── normaliseRole — happy path ────────────────────────────────────────────────

test('normaliseRole lowercases and removes spaces', () => {
  assert.equal(normaliseRole('Company Admin'), 'companyadmin')
})

test('normaliseRole lowercases and removes underscores', () => {
  assert.equal(normaliseRole('company_admin'), 'companyadmin')
})

test('normaliseRole lowercases and removes hyphens', () => {
  assert.equal(normaliseRole('company-admin'), 'companyadmin')
})

test('normaliseRole handles all caps', () => {
  assert.equal(normaliseRole('COMPANY_ADMIN'), 'companyadmin')
})

test('normaliseRole handles school admin variations', () => {
  assert.equal(normaliseRole('School Admin'), 'schooladmin')
  assert.equal(normaliseRole('school_admin'), 'schooladmin')
  assert.equal(normaliseRole('schoolAdmin'), 'schooladmin')
})

test('normaliseRole handles staff', () => {
  assert.equal(normaliseRole('Staff'), 'staff')
  assert.equal(normaliseRole('STAFF'), 'staff')
})

// ── normaliseRole — breaking points ──────────────────────────────────────────

test('normaliseRole handles null gracefully', () => {
  assert.equal(normaliseRole(null), '')
})

test('normaliseRole handles undefined gracefully', () => {
  assert.equal(normaliseRole(undefined), '')
})

test('normaliseRole handles empty string', () => {
  assert.equal(normaliseRole(''), '')
})

test('normaliseRole handles whitespace only', () => {
  assert.equal(normaliseRole('   '), '')
})

test('normaliseRole handles numeric input', () => {
  assert.equal(typeof normaliseRole(123), 'string')
})

test('normaliseRole handles special characters', () => {
  assert.equal(typeof normaliseRole('<script>alert(1)</script>'), 'string')
})

test('normaliseRole handles very long string without crashing', () => {
  const long = 'a'.repeat(10000)
  assert.equal(typeof normaliseRole(long), 'string')
})