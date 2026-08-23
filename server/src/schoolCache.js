// schoolCache.js
//
// Caches the full `schools` collection in memory. Schools change rarely but are
// read on almost every request (role scoping, school-name resolution, dropdown
// population), so an uncached read would add a Firestore round trip to nearly
// every page load.
//
// The whole collection is cached as one entry rather than per-role slices: the
// list is small, and role scoping is applied after the read. Mutations call
// invalidateSchoolCache() so a newly created or renamed school is visible to the
// next request instead of waiting out the TTL.
//
// The TTL is the backstop for changes this process did not make: a document
// edited straight in the Firebase console, or a write by another server
// instance. Those are picked up within one TTL rather than immediately, because
// the cache is per-process. Anything that goes through /api/schools is instant.

const DEFAULT_TTL_MS = 60 * 1000
const ttlMs = Number(process.env.SCHOOL_CACHE_TTL_MS || DEFAULT_TTL_MS)

let cached = null

// Incremented on every mutation. The client polls this via the `version` field
// on the list response, so it can tell "nothing changed" from "changed" without
// diffing the payload.
let version = 1

function getCachedSchools() {
  if (!cached) return null

  if (Date.now() - cached.createdAt > ttlMs) {
    cached = null
    return null
  }

  return cached.schools
}

function setCachedSchools(schools) {
  cached = { createdAt: Date.now(), schools }
}

function invalidateSchoolCache() {
  cached = null
  version += 1
  console.log('School cache invalidated  version', version)
}

function getSchoolCacheVersion() {
  return version
}

// Test hook: reset both the entry and the version counter.
function resetSchoolCache() {
  cached = null
  version = 1
}

module.exports = {
  getCachedSchools,
  setCachedSchools,
  invalidateSchoolCache,
  getSchoolCacheVersion,
  resetSchoolCache,
}
