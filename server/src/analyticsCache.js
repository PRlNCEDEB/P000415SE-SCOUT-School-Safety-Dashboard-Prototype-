// analyticsCache.js — In-memory analytics cache for SCOUT
// Eliminates repeated Firestore reads by caching the full analytics payload.
// Cache is invalidated whenever an incident is created or its status changes.

const { getDb } = require('./db/firebase')

// ── Cache state ───────────────────────────────────────────────────────────────
let cachedData = null      // Holds the full analytics payload when warm
let cacheIsDirty = true    // true = needs rebuild from Firestore on next request

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(val) {
  if (!val) return null
  if (typeof val.toDate === 'function') return val.toDate()
  const d = new Date(val)
  return isNaN(d) ? null : d
}

function getResponseTime(incident) {
  if (incident.status !== 'resolved') return null
  const created = toDate(incident.createdAt)
  const updated = toDate(incident.updatedAt)
  if (!created || !updated) return null
  const mins = (updated - created) / 60000
  return mins > 0 ? mins : null
}

// ── Build analytics from Firestore ────────────────────────────────────────────
async function buildAnalytics() {
  const db = getDb()
  const snapshot = await db.collection('incidents').get()
  const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Summary metrics
  const totalIncidents = incidents.length
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length
  const allResponseTimes = incidents.map(getResponseTime).filter(v => v !== null)
  const avgResponseTime = allResponseTimes.length > 0
    ? parseFloat((allResponseTimes.reduce((sum, v) => sum + v, 0) / allResponseTimes.length).toFixed(1))
    : 0
  const thisWeekIncidents = incidents.filter(i => {
    const d = toDate(i.createdAt)
    return d && d >= weekAgo
  }).length

  // Incidents by type
  const typeCounts = {}
  incidents.forEach(i => {
    const type = i.type?.charAt(0).toUpperCase() + i.type?.slice(1) || 'Unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  const incidentsByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

  // Status breakdown
  const statusMap = { resolved: 'Resolved', acknowledged: 'Acknowledged', triggered: 'Triggered', archived: 'Archived' }
  const statusCounts = {}
  Object.values(statusMap).forEach(s => { statusCounts[s] = 0 })
  incidents.forEach(i => {
    const name = statusMap[i.status] || 'Unknown'
    statusCounts[name] = (statusCounts[name] || 0) + 1
  })
  const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // By location
  const locationCounts = {}
  incidents.forEach(i => {
    const loc = i.location || 'Unknown'
    locationCounts[loc] = (locationCounts[loc] || 0) + 1
  })
  const locationData = Object.entries(locationCounts).map(([location, count]) => ({ location, count }))

  // This week by day (Mon–Sun)
  const startOfWeek = new Date(now)
  const dowOffset = (startOfWeek.getUTCDay() === 0 ? -6 : 1 - startOfWeek.getUTCDay())
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() + dowOffset)
  startOfWeek.setUTCHours(0, 0, 0, 0)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' }
  const dayCounts = {}
  days.forEach(d => { dayCounts[d] = 0 })
  incidents.forEach(i => {
    const d = toDate(i.createdAt)
    if (d && d >= startOfWeek) dayCounts[dayMap[d.getUTCDay()]]++
  })
  const incidentsByDay = days.map(d => ({ day: d, incidents: dayCounts[d] }))

  // Response time trend (last 4 weeks)
  const weekData = {}
  for (let i = 0; i < 4; i++) weekData[`Week ${i + 1}`] = { total: 0, count: 0 }
  incidents.forEach(i => {
    const d = toDate(i.createdAt)
    if (!d) return
    const weekNumber = Math.floor((now - d) / (7 * 24 * 60 * 60 * 1000)) + 1
    if (weekNumber >= 1 && weekNumber <= 4) {
      const key = `Week ${5 - weekNumber}`
      if (weekData[key]) {
        const rt = getResponseTime(i)
        if (rt !== null) { weekData[key].total += rt; weekData[key].count++ }
      }
    }
  })
  const responseTimeData = Object.entries(weekData).map(([week, d]) => ({
    week,
    avgMinutes: d.count > 0 ? parseFloat((d.total / d.count).toFixed(1)) : 0,
  }))

  return {
    summary: { totalIncidents, resolvedCount, avgResponseTime, thisWeekIncidents },
    incidentsByType,
    statusBreakdown,
    locationData,
    incidentsByDay,
    responseTimeData,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the full analytics payload.
 * Reads from Firestore only when the cache is dirty (first request, or after invalidation).
 * All subsequent requests return the in-memory cache — 0 Firestore reads.
 */
async function getAnalytics() {
  if (!cacheIsDirty && cachedData) {
    console.log('📊 Analytics served from cache (0 Firestore reads)')
    return cachedData
  }

  console.log('🔄 Analytics cache miss — rebuilding from Firestore...')
  cachedData = await buildAnalytics()
  cacheIsDirty = false
  console.log('✅ Analytics cache rebuilt')
  return cachedData
}

/**
 * Mark the cache as dirty so the next request rebuilds from Firestore.
 * Call this whenever an incident is created or its status changes.
 */
function invalidateAnalyticsCache() {
  cacheIsDirty = true
  cachedData = null
  console.log('🗑️  Analytics cache invalidated')
}

module.exports = { getAnalytics, invalidateAnalyticsCache }
