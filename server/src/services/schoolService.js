// schoolService.js
//
// Single source of truth for the `schools` collection.
//
// Every school read in the application goes through here so that:
//   • school names resolve from one place instead of duplicated per-route helpers,
//   • the collection is cached once (see schoolCache.js),
//   • renaming a school propagates to the collections that denormalise
//     `schoolName`, instead of leaving stale copies behind.

const { getDb } = require('../db/firebase')
const {
  getCachedSchools,
  setCachedSchools,
  invalidateSchoolCache,
} = require('../schoolCache')
const { invalidateIncidentListCache } = require('../incidentListCache')
const { invalidateAnalyticsCache } = require('../analyticsCache')

const SCHOOL_ID_PREFIX = 'school_'
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 120
const MAX_SLUG_LENGTH = 60
const MAX_SLUG_ATTEMPTS = 50

// Firestore caps a batch at 500 writes; stay under it with headroom.
const BACKFILL_CHUNK_SIZE = 400

// Collections that store a denormalised copy of `schoolName` alongside
// `schoolId`. A rename has to update every one of them or the UI shows two
// different names for the same school.
const DENORMALISED_COLLECTIONS = [
  'users',
  'incidents',
  'archivedIncidents',
  'notifications',
  'notificationRecipients',
  'notificationRouting',
]

// Statuses that mean an incident is still live. Deactivating a school while one
// of these is open would hide an in-progress emergency, so it is blocked.
const ACTIVE_INCIDENT_STATUSES = ['triggered', 'acknowledged', 'in-progress']

// ── Errors ────────────────────────────────────────────────────────────────────

// Carries an HTTP status so routes can map failures without string matching.
class SchoolServiceError extends Error {
  constructor(message, status = 400, code = 'school_error') {
    super(message)
    this.name = 'SchoolServiceError'
    this.status = status
    this.code = code
  }
}

// ── Pure helpers (no database access  unit tested directly) ──────────────────

function normaliseRole(role) {
  return String(role || '').toLowerCase().replace(/[-_\s]/g, '')
}

// Collapses internal runs of whitespace and trims. "  Alpha   School " → "Alpha School"
function normaliseSchoolName(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim()
}

// Case- and whitespace-insensitive comparison, used for duplicate detection.
function schoolNamesMatch(left, right) {
  return normaliseSchoolName(left).toLowerCase() === normaliseSchoolName(right).toLowerCase()
}

function validateSchoolName(raw) {
  const name = normaliseSchoolName(raw)

  if (!name) {
    return { valid: false, error: 'School name is required.' }
  }
  // Control characters would corrupt display and break CSV/exports downstream.
  if (/[\x00-\x1f\x7f]/.test(name)) {
    return { valid: false, error: 'School name contains invalid characters.' }
  }
  if (name.length < MIN_NAME_LENGTH) {
    return { valid: false, error: `School name must be at least ${MIN_NAME_LENGTH} characters.` }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `School name must be ${MAX_NAME_LENGTH} characters or fewer.` }
  }

  return { valid: true, name }
}

// Builds a readable, stable document ID from a name, matching the existing
// `school_alpha` convention. Returns '' when the name has no characters that
// survive slugification (e.g. a name written entirely in a non-Latin script) —
// callers fall back to a generated ID in that case.
function slugifySchoolId(rawName) {
  const slug = normaliseSchoolName(rawName)
    .toLowerCase()
    .normalize('NFKD')                 // split accented characters apart
    .replace(/[\u0300-\u036f]/g, '')   // then drop the accent marks
    .replace(/['\u2018\u2019\u0060]/g, '')  // drop apostrophes rather than making them separators
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/_+$/g, '')               // slice may have left a trailing underscore

  return slug ? `${SCHOOL_ID_PREFIX}${slug}` : ''
}

// Sorts by display name so every dropdown in the app is ordered identically.
function compareSchoolsByName(left, right) {
  return String(left.name || '').localeCompare(String(right.name || ''), 'en', { sensitivity: 'base' })
}

// Applies role scoping to an already-loaded list.
//   Company Admin → every school
//   everyone else → only the school they belong to
function scopeSchoolsToProfile(schools, profile, { includeInactive = false } = {}) {
  const visible = normaliseRole(profile?.role) === 'companyadmin'
    ? schools
    : schools.filter(school => profile?.schoolId && school.id === profile.schoolId)

  // A user always sees their own school even if it has been deactivated,
  // otherwise their own dashboard header would render blank.
  return includeInactive
    ? visible
    : visible.filter(school => school.active !== false || school.id === profile?.schoolId)
}

// ── Reads ─────────────────────────────────────────────────────────────────────

// Loads every school document, cached.
//
// Deliberately does NOT use .orderBy('createdAt'): Firestore silently omits
// documents missing the ordered field, so a school written without createdAt
// would vanish from every dropdown. Sorting happens in memory instead.
async function fetchAllSchools({ bypassCache = false } = {}) {
  // Mutations pass bypassCache so their uniqueness checks run against current
  // data rather than a list that may be up to one TTL old.
  if (!bypassCache) {
    const cached = getCachedSchools()
    if (cached) return cached
  }

  const snapshot = await getDb().collection('schools').get()
  const schools = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort(compareSchoolsByName)

  setCachedSchools(schools)
  return schools
}

async function listSchools({ includeInactive = false } = {}) {
  const schools = await fetchAllSchools()
  return includeInactive ? schools : schools.filter(school => school.active !== false)
}

async function listSchoolsForProfile(profile, options = {}) {
  const schools = await fetchAllSchools()
  return scopeSchoolsToProfile(schools, profile, options)
}

async function getSchoolById(schoolId) {
  if (!schoolId) return null
  const schools = await fetchAllSchools()
  return schools.find(school => school.id === schoolId) || null
}

// Shared replacement for the getSchoolName helpers that were duplicated in
// incidents.js and notifications.js. Served from cache, so it costs no read.
async function getSchoolName(schoolId) {
  const school = await getSchoolById(schoolId)
  return school?.name || null
}

// Counts incidents that are still open for a school.
//
// Filters status in memory rather than adding .where('status','in',[...]): a
// second filtered field would require a composite Firestore index, and this
// project intentionally runs without any.
async function countActiveIncidents(schoolId) {
  const snapshot = await getDb().collection('incidents').where('schoolId', '==', schoolId).get()

  return snapshot.docs.filter(doc => ACTIVE_INCIDENT_STATUSES.includes(doc.data()?.status)).length
}

// ── Writes ────────────────────────────────────────────────────────────────────

// Picks a document ID that is not already taken. Two different names can
// slugify to the same string ("St Mary's" / "St Marys"), so a numeric suffix is
// appended when that happens.
function resolveAvailableSchoolId(name, existingSchools) {
  const taken = new Set(existingSchools.map(school => school.id))
  const base = slugifySchoolId(name)

  if (!base) return null       // caller falls back to a Firestore-generated ID
  if (!taken.has(base)) return base

  for (let suffix = 2; suffix <= MAX_SLUG_ATTEMPTS; suffix += 1) {
    const candidate = `${base}_${suffix}`
    if (!taken.has(candidate)) return candidate
  }

  return null
}

async function createSchool({ name }) {
  const validation = validateSchoolName(name)
  if (!validation.valid) {
    throw new SchoolServiceError(validation.error, 400, 'invalid_name')
  }

  const db = getDb()
  const existing = await fetchAllSchools({ bypassCache: true })

  if (existing.some(school => schoolNamesMatch(school.name, validation.name))) {
    throw new SchoolServiceError('A school with this name already exists.', 409, 'duplicate_name')
  }

  const schoolId = resolveAvailableSchoolId(validation.name, existing) || db.collection('schools').doc().id
  const now = new Date().toISOString()
  const record = {
    name: validation.name,
    active: true,
    createdAt: now,
    updatedAt: now,
  }

  try {
    // .create() rejects if the document already exists, which closes the race
    // between two admins submitting the same name at the same moment.
    await db.collection('schools').doc(schoolId).create(record)
  } catch (err) {
    if (err?.code === 6 || /already exists/i.test(err?.message || '')) {
      throw new SchoolServiceError('A school with this name already exists.', 409, 'duplicate_name')
    }
    throw err
  }

  invalidateSchoolCache()
  return { id: schoolId, ...record }
}

// Rewrites the denormalised `schoolName` on every collection that carries one.
//
// Only `schoolName` is written  deliberately not `updatedAt`. Bumping
// updatedAt on incidents would make a rename look like incident activity and
// would distort the analytics response-time calculations.
async function propagateSchoolName(db, schoolId, schoolName) {
  const propagated = {}

  for (const collectionName of DENORMALISED_COLLECTIONS) {
    const snapshot = await db.collection(collectionName).where('schoolId', '==', schoolId).get()
    const stale = snapshot.docs.filter(doc => doc.data()?.schoolName !== schoolName)

    for (let index = 0; index < stale.length; index += BACKFILL_CHUNK_SIZE) {
      const chunk = stale.slice(index, index + BACKFILL_CHUNK_SIZE)
      const batch = db.batch()
      chunk.forEach(doc => batch.update(doc.ref, { schoolName }))
      await batch.commit()
    }

    propagated[collectionName] = stale.length
  }

  return propagated
}

async function renameSchool(schoolId, { name }) {
  const validation = validateSchoolName(name)
  if (!validation.valid) {
    throw new SchoolServiceError(validation.error, 400, 'invalid_name')
  }

  const db = getDb()
  const existing = await fetchAllSchools({ bypassCache: true })
  const school = existing.find(entry => entry.id === schoolId)

  if (!school) {
    throw new SchoolServiceError('School not found.', 404, 'not_found')
  }

  const clashes = existing.some(
    entry => entry.id !== schoolId && schoolNamesMatch(entry.name, validation.name)
  )
  if (clashes) {
    throw new SchoolServiceError('A school with this name already exists.', 409, 'duplicate_name')
  }

  // Nothing to do  skip the write and the (expensive) propagation pass.
  if (school.name === validation.name) {
    return { school, propagated: {}, changed: false }
  }

  const now = new Date().toISOString()
  await db.collection('schools').doc(schoolId).update({
    name: validation.name,
    updatedAt: now,
  })

  const propagated = await propagateSchoolName(db, schoolId, validation.name)

  invalidateSchoolCache()

  // The incident and analytics caches hold incident rows that carry the old
  // schoolName. Without clearing them the rename would appear to take up to
  // 30 seconds to show up on the Incidents and Analytics pages.
  invalidateIncidentListCache()
  invalidateAnalyticsCache()

  return {
    school: { ...school, name: validation.name, updatedAt: now },
    propagated,
    changed: true,
  }
}

// Soft delete. Schools are never hard-deleted: incidents, users and routing
// rules all reference schoolId, and removing the document would orphan them.
async function setSchoolActive(schoolId, active) {
  if (typeof active !== 'boolean') {
    throw new SchoolServiceError('active must be true or false.', 400, 'invalid_active')
  }

  const db = getDb()
  const fresh = await fetchAllSchools({ bypassCache: true })
  const school = fresh.find(entry => entry.id === schoolId)

  if (!school) {
    throw new SchoolServiceError('School not found.', 404, 'not_found')
  }

  if (!active) {
    const openIncidents = await countActiveIncidents(schoolId)
    if (openIncidents > 0) {
      throw new SchoolServiceError(
        `Cannot deactivate: ${openIncidents} incident(s) are still open at this school.`,
        409,
        'has_active_incidents'
      )
    }
  }

  const now = new Date().toISOString()
  await db.collection('schools').doc(schoolId).update({ active, updatedAt: now })

  invalidateSchoolCache()

  return { ...school, active, updatedAt: now }
}

module.exports = {
  // pure helpers
  normaliseRole,
  normaliseSchoolName,
  schoolNamesMatch,
  validateSchoolName,
  slugifySchoolId,
  compareSchoolsByName,
  scopeSchoolsToProfile,
  resolveAvailableSchoolId,

  // reads
  fetchAllSchools,
  listSchools,
  listSchoolsForProfile,
  getSchoolById,
  getSchoolName,
  countActiveIncidents,

  // writes
  createSchool,
  renameSchool,
  setSchoolActive,

  // shared constants / errors
  SchoolServiceError,
  DENORMALISED_COLLECTIONS,
  ACTIVE_INCIDENT_STATUSES,
}
