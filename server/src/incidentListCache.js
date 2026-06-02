const DEFAULT_TTL_MS = 30 * 1000
const ttlMs = Number(process.env.INCIDENT_LIST_CACHE_TTL_MS || DEFAULT_TTL_MS)

const cachedIncidentLists = new Map()

function normaliseRole(role) {
  return String(role || '').toLowerCase().replace(/[-_\s]/g, '')
}

function getIncidentListCacheKey(profile) {
  const role = normaliseRole(profile?.role)

  if (role === 'companyadmin') return 'companyadmin:all'
  if (role === 'schooladmin') return `schooladmin:${profile?.schoolId || 'none'}`

  return `staff:${profile?.uid || profile?.email || 'unknown'}`
}

function getCachedIncidentList(profile) {
  const key = getIncidentListCacheKey(profile)
  const cached = cachedIncidentLists.get(key)

  if (!cached) return null

  if (Date.now() - cached.createdAt > ttlMs) {
    cachedIncidentLists.delete(key)
    return null
  }

  return cached.incidents
}

function setCachedIncidentList(profile, incidents) {
  const key = getIncidentListCacheKey(profile)
  cachedIncidentLists.set(key, {
    createdAt: Date.now(),
    incidents,
  })
}

function invalidateIncidentListCache() {
  if (cachedIncidentLists.size > 0) {
    cachedIncidentLists.clear()
    console.log('Incident list cache invalidated')
  }
}

module.exports = {
  getCachedIncidentList,
  setCachedIncidentList,
  invalidateIncidentListCache,
}
