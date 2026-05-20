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

// Measures createdAt → updatedAt for resolved incidents (full resolution time)
function getResolutionTime(incident) {
  if (incident.status !== 'resolved') return null
  const created = toDate(incident.createdAt)
  const updated = toDate(incident.updatedAt)
  if (!created || !updated) return null
  const mins = (updated - created) / 60000
  return mins > 0 ? mins : null
}

// Measures createdAt → acknowledgedAt (true first-response metric)
function getAcknowledgementTime(incident) {
  if (!incident.acknowledgedAt) return null
  const created = toDate(incident.createdAt)
  const acked = toDate(incident.acknowledgedAt)
  if (!created || !acked) return null
  const mins = (acked - created) / 60000
  return mins > 0 ? mins : null
}

// ── Build analytics from Firestore ────────────────────────────────────────────
async function buildAnalytics() {
  const db = getDb()

  // Fetch incidents and notifications in parallel to minimise Firestore latency
  const [incidentsSnapshot, notificationsSnapshot] = await Promise.all([
    db.collection('incidents').get(),
    db.collection('notifications').get(),
  ])
  const incidents = incidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Summary metrics
  const totalIncidents = incidents.length
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length
  const activeIncidents = incidents.filter(i => i.status !== 'archived' && i.status !== 'resolved')
  const criticalCount = activeIncidents.filter(i => i.priority === 'critical').length
  const highCount = activeIncidents.filter(i => i.priority === 'high').length

  // Avg Response Time — uses acknowledgedAt (true first-response metric)
  const allAckTimes = incidents.map(getAcknowledgementTime).filter(v => v !== null)
  const avgResponseTime = allAckTimes.length > 0
    ? parseFloat((allAckTimes.reduce((sum, v) => sum + v, 0) / allAckTimes.length).toFixed(1))
    : 0

  const thisWeekIncidents = incidents.filter(i => {
    const d = toDate(i.createdAt)
    return d && d >= weekAgo
  }).length

  // Unacknowledged count — triggered with no acknowledgedBy entries
  const unacknowledgedCount = incidents.filter(i =>
    i.status === 'triggered' && (!i.acknowledgedBy || i.acknowledgedBy.length === 0)
  ).length

  // Incidents by type
  const typeCounts = {}
  incidents.forEach(i => {
    const type = i.type?.charAt(0).toUpperCase() + i.type?.slice(1) || 'Unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  const incidentsByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

  // Status breakdown — includes 'in-progress' so no incidents fall through as Unknown
  const statusMap = {
    resolved: 'Resolved',
    acknowledged: 'Acknowledged',
    'in-progress': 'In Progress',
    triggered: 'Triggered',
    archived: 'Archived',
  }
  const statusCounts = {}
  Object.values(statusMap).forEach(s => { statusCounts[s] = 0 })
  incidents.forEach(i => {
    const name = statusMap[i.status] || 'Unknown'
    statusCounts[name] = (statusCounts[name] || 0) + 1
  })
  const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // By location — normalise casing so e.g. "Dashboard quick action" and
  // "Dashboard Quick Action" (legacy seed data) collapse into one entry
  const locationCounts = {}
  incidents.forEach(i => {
    const raw = (i.location || 'Unknown').trim()
    const key = raw.toLowerCase()
    if (!locationCounts[key]) locationCounts[key] = { display: raw, count: 0 }
    locationCounts[key].count++
  })
  const locationData = Object.values(locationCounts).map(({ display, count }) => ({ location: display, count }))

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

  // Response & Resolution time trend (last 4 weeks)
  // ack = createdAt → acknowledgedAt; resolution = createdAt → updatedAt (resolved only)
  const weekData = {}
  for (let i = 0; i < 4; i++) weekData[`Week ${i + 1}`] = { ackTotal: 0, ackCount: 0, resTotal: 0, resCount: 0 }
  incidents.forEach(i => {
    const d = toDate(i.createdAt)
    if (!d) return
    const weekNumber = Math.floor((now - d) / (7 * 24 * 60 * 60 * 1000)) + 1
    if (weekNumber >= 1 && weekNumber <= 4) {
      const key = `Week ${5 - weekNumber}`
      if (weekData[key]) {
        const ack = getAcknowledgementTime(i)
        if (ack !== null) { weekData[key].ackTotal += ack; weekData[key].ackCount++ }
        const res = getResolutionTime(i)
        if (res !== null) { weekData[key].resTotal += res; weekData[key].resCount++ }
      }
    }
  })
  const responseTimeData = Object.entries(weekData).map(([week, d]) => ({
    week,
    avgAckMinutes: d.ackCount > 0 ? parseFloat((d.ackTotal / d.ackCount).toFixed(1)) : 0,
    avgResolutionMinutes: d.resCount > 0 ? parseFloat((d.resTotal / d.resCount).toFixed(1)) : 0,
  }))

  // Failed alerts — count from notifications collection
  const failedSms = notifications.filter(n => n.sms === 'failed').length
  const failedEmail = notifications.filter(n => n.email === 'failed').length
  const failedAlerts = { total: failedSms + failedEmail, sms: failedSms, email: failedEmail }

  return {
    summary: { totalIncidents, resolvedCount, avgResponseTime, thisWeekIncidents, unacknowledgedCount, activeIncidents: activeIncidents.length, criticalCount, highCount },
    incidentsByType,
    statusBreakdown,
    locationData,
    incidentsByDay,
    responseTimeData,
    failedAlerts,
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
