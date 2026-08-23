const test = require('node:test')
const assert = require('node:assert/strict')

// Mock firebase before requiring the service, so nothing tries to reach a real
// database. Only the pure helpers are exercised here; the database-backed paths
// are covered by schools.integration.test.js.
const firebasePath = require.resolve('../src/db/firebase')

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

const servicePath = require.resolve('../src/services/schoolService')
delete require.cache[servicePath]

const {
  normaliseSchoolName,
  schoolNamesMatch,
  validateSchoolName,
  slugifySchoolId,
  compareSchoolsByName,
  scopeSchoolsToProfile,
  resolveAvailableSchoolId,
} = require(servicePath)

// ── normaliseSchoolName ───────────────────────────────────────────────────────

test('normaliseSchoolName trims surrounding whitespace', () => {
  assert.equal(normaliseSchoolName('  Alpha School  '), 'Alpha School')
})

test('normaliseSchoolName collapses internal whitespace runs', () => {
  assert.equal(normaliseSchoolName('Alpha    School'), 'Alpha School')
})

test('normaliseSchoolName collapses tabs and newlines', () => {
  assert.equal(normaliseSchoolName('Alpha\t\nSchool'), 'Alpha School')
})

test('normaliseSchoolName handles null and undefined', () => {
  assert.equal(normaliseSchoolName(null), '')
  assert.equal(normaliseSchoolName(undefined), '')
})

// ── validateSchoolName ────────────────────────────────────────────────────────

test('validateSchoolName accepts a normal name and returns it normalised', () => {
  const result = validateSchoolName('  Bunbury Senior High  ')
  assert.equal(result.valid, true)
  assert.equal(result.name, 'Bunbury Senior High')
})

test('validateSchoolName rejects an empty name', () => {
  assert.equal(validateSchoolName('').valid, false)
  assert.equal(validateSchoolName('   ').valid, false)
})

test('validateSchoolName rejects a single character', () => {
  const result = validateSchoolName('A')
  assert.equal(result.valid, false)
  assert.match(result.error, /at least 2 characters/)
})

test('validateSchoolName rejects a name over 120 characters', () => {
  const result = validateSchoolName('A'.repeat(121))
  assert.equal(result.valid, false)
  assert.match(result.error, /120 characters or fewer/)
})

test('validateSchoolName accepts exactly 120 characters', () => {
  assert.equal(validateSchoolName('A'.repeat(120)).valid, true)
})

test('validateSchoolName rejects control characters', () => {
  assert.equal(validateSchoolName('Bad\x00Name').valid, false)
  assert.equal(validateSchoolName('Bad\x1fName').valid, false)
  assert.equal(validateSchoolName('Bad\x7fName').valid, false)
})

// ── schoolNamesMatch ──────────────────────────────────────────────────────────

test('schoolNamesMatch ignores case', () => {
  assert.equal(schoolNamesMatch('Alpha School', 'ALPHA SCHOOL'), true)
})

test('schoolNamesMatch ignores surrounding and internal whitespace', () => {
  assert.equal(schoolNamesMatch('Alpha School', '  alpha   school '), true)
})

test('schoolNamesMatch distinguishes genuinely different names', () => {
  assert.equal(schoolNamesMatch('Alpha School', 'Beta School'), false)
})

// ── slugifySchoolId ───────────────────────────────────────────────────────────

test('slugifySchoolId builds the school_ prefixed convention', () => {
  assert.equal(slugifySchoolId('Alpha School'), 'school_alpha_school')
})

test('slugifySchoolId strips apostrophes rather than making them separators', () => {
  assert.equal(slugifySchoolId("St. Mary's College"), 'school_st_marys_college')
})

test('slugifySchoolId treats curly and straight apostrophes identically', () => {
  assert.equal(slugifySchoolId("St. Mary's College"), slugifySchoolId('St. Mary’s College'))
})

test('slugifySchoolId folds accented characters to ASCII', () => {
  assert.equal(slugifySchoolId('Ecole Frère'), 'school_ecole_frere')
})

test('slugifySchoolId collapses punctuation runs into single underscores', () => {
  assert.equal(slugifySchoolId('Alpha -- School'), 'school_alpha_school')
})

test('slugifySchoolId never ends with a trailing underscore', () => {
  assert.equal(slugifySchoolId('Alpha School!!!').endsWith('_'), false)
})

test('slugifySchoolId returns empty string when nothing survives slugification', () => {
  assert.equal(slugifySchoolId('北京学校'), '')
  assert.equal(slugifySchoolId('!!!'), '')
})

// ── resolveAvailableSchoolId ──────────────────────────────────────────────────

test('resolveAvailableSchoolId returns the base slug when it is free', () => {
  assert.equal(resolveAvailableSchoolId('Alpha School', []), 'school_alpha_school')
})

test('resolveAvailableSchoolId appends a suffix when the slug is taken', () => {
  const taken = [{ id: 'school_alpha_school' }]
  assert.equal(resolveAvailableSchoolId('Alpha School', taken), 'school_alpha_school_2')
})

test('resolveAvailableSchoolId keeps incrementing past consecutive collisions', () => {
  const taken = [
    { id: 'school_alpha_school' },
    { id: 'school_alpha_school_2' },
    { id: 'school_alpha_school_3' },
  ]
  assert.equal(resolveAvailableSchoolId('Alpha School', taken), 'school_alpha_school_4')
})

test('resolveAvailableSchoolId returns null when the name yields no slug', () => {
  assert.equal(resolveAvailableSchoolId('北京学校', []), null)
})

// ── compareSchoolsByName ──────────────────────────────────────────────────────

test('compareSchoolsByName sorts alphabetically regardless of case', () => {
  const sorted = [{ name: 'beta' }, { name: 'Alpha' }, { name: 'Gamma' }].sort(compareSchoolsByName)
  assert.deepEqual(sorted.map(school => school.name), ['Alpha', 'beta', 'Gamma'])
})

test('compareSchoolsByName tolerates a missing name', () => {
  const sorted = [{ name: 'Alpha' }, {}].sort(compareSchoolsByName)
  assert.equal(sorted.length, 2)
})

// ── scopeSchoolsToProfile ─────────────────────────────────────────────────────

const ALL_SCHOOLS = [
  { id: 'school_alpha', name: 'Alpha School', active: true },
  { id: 'school_beta', name: 'Beta School', active: true },
  { id: 'school_closed', name: 'Closed School', active: false },
]

test('scopeSchoolsToProfile gives a Company Admin every active school', () => {
  const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'Company Admin' })
  assert.deepEqual(result.map(school => school.id), ['school_alpha', 'school_beta'])
})

test('scopeSchoolsToProfile gives a Company Admin inactive schools when asked', () => {
  const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'Company Admin' }, { includeInactive: true })
  assert.equal(result.length, 3)
})

test('scopeSchoolsToProfile restricts a School Admin to their own school', () => {
  const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'School Admin', schoolId: 'school_beta' })
  assert.deepEqual(result.map(school => school.id), ['school_beta'])
})

test('scopeSchoolsToProfile restricts staff to their own school', () => {
  const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'staff', schoolId: 'school_alpha' })
  assert.deepEqual(result.map(school => school.id), ['school_alpha'])
})

test('scopeSchoolsToProfile returns nothing for an unassigned non-admin', () => {
  assert.deepEqual(scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'staff', schoolId: null }), [])
})

test('scopeSchoolsToProfile does not leak another school to a School Admin', () => {
  const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'School Admin', schoolId: 'school_beta' })
  assert.equal(result.some(school => school.id === 'school_alpha'), false)
})

test('scopeSchoolsToProfile still shows a user their own deactivated school', () => {
  // Otherwise their dashboard header would render blank the moment a Company
  // Admin deactivates the school they belong to.
  const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'staff', schoolId: 'school_closed' })
  assert.deepEqual(result.map(school => school.id), ['school_closed'])
})

test('scopeSchoolsToProfile normalises role spelling variants', () => {
  for (const role of ['companyadmin', 'company_admin', 'COMPANY-ADMIN', 'Company Admin']) {
    const result = scopeSchoolsToProfile(ALL_SCHOOLS, { role })
    assert.equal(result.length, 2, `role "${role}" should be treated as Company Admin`)
  }
})

test('scopeSchoolsToProfile treats an unknown role as non-admin', () => {
  assert.deepEqual(scopeSchoolsToProfile(ALL_SCHOOLS, { role: 'principal', schoolId: null }), [])
})
