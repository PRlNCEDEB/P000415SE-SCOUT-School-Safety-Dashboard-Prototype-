// analyticsCache.js - In-memory analytics cache for SCOUT.
// Cache is invalidated whenever an incident or notification changes.

const { getDb } = require('./db/firebase')

let cachedData = new Map()
let cacheIsDirty = true

function toDate(val) {
  if (!val) return null
  if (typeof val.toDate === 'function') return val.toDate()
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

function getResolutionTime(incident) {
  if (incident.status !== 'resolved') return null
  const created = toDate(incident.createdAt)
  const updated = toDate(incident.updatedAt)
  if (!created || !updated) return null
  const mins = (updated - created) / 60000
  return mins > 0 ? mins : null
}

function getAcknowledgementTime(incident) {
  const created = toDate(incident.createdAt)
  if (!created) return null

  const acknowledgedBy = Array.isArray(incident.acknowledgedBy) ? incident.acknowledgedBy : []
  const acknowledgedAt = acknowledgedBy
    .map(entry => toDate(entry.acknowledgedAt))
    .filter(Boolean)
    .sort((a, b) => a - b)[0] || toDate(incident.acknowledgedAt)

  if (!acknowledgedAt) return null
  const mins = (acknowledgedAt - created) / 60000
  return mins > 0 ? mins : null
}

function hasFailedSms(notification) {
  return notification.sms === 'failed' || notification.smsStatus === 'failed'
}

function hasFailedEmail(notification) {
  return notification.email === 'failed' || notification.emailStatus === 'failed'
}

async function getFailedAlerts(db, schoolId) {
  let query = db.collection('notifications')

  if (schoolId) {
    query = query.where('schoolId', '==', schoolId)
  }

  const snapshot = await query.get()
  const notifications = snapshot.docs.map(doc => doc.data())
  const sms = notifications.filter(hasFailedSms).length
  const email = notifications.filter(hasFailedEmail).length

  return { total: sms + email, sms, email }
}

async function buildAnalytics({ schoolId = null, includeFailedAlerts = false } = {}) {
  const db = getDb()
  let incidentsQuery = db.collection('incidents')

  if (schoolId) {
    incidentsQuery = incidentsQuery.where('schoolId', '==', schoolId)
  }

  const snapshot = await incidentsQuery.get()
  const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const totalIncidents = incidents.length
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length
  const activeIncidents = incidents.filter(i => i.status !== 'archived' && i.status !== 'resolved')
  const criticalCount = activeIncidents.filter(i => i.priority === 'critical').length
  const highCount = activeIncidents.filter(i => i.priority === 'high').length
  const unacknowledgedCount = incidents.filter(i => !i.acknowledgedBy?.length && i.status !== 'resolved').length

  const allAckTimes = incidents.map(getAcknowledgementTime).filter(v => v !== null)
  const avgAckTime = allAckTimes.length > 0
    ? parseFloat((allAckTimes.reduce((sum, v) => sum + v, 0) / allAckTimes.length).toFixed(1))
    : 0

  const thisWeekIncidents = incidents.filter(i => {
    const d = toDate(i.createdAt)
    return d && d >= weekAgo
  }).length

  const typeCounts = {}
  incidents.forEach(i => {
    const type = i.type?.charAt(0).toUpperCase() + i.type?.slice(1) || 'Unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  const incidentsByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

  const statusMap = {
    resolved: 'Resolved',
    acknowledged: 'Acknowledged',
    triggered: 'Triggered',
    archived: 'Archived',
    'in-progress': 'In Progress',
  }
  const statusCounts = {}
  Object.values(statusMap).forEach(status => { statusCounts[status] = 0 })
  incidents.forEach(i => {
    const name = statusMap[i.status] || 'Unknown'
    statusCounts[name] = (statusCounts[name] || 0) + 1
  })
  const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const locationCounts = {}
  incidents.forEach(i => {
    const raw = (i.location || 'Unknown').trim()
    const key = raw.toLowerCase()
    if (!locationCounts[key]) locationCounts[key] = { display: raw, count: 0 }
    locationCounts[key].count++
  })
  const locationData = Object.values(locationCounts).map(({ display, count }) => ({ location: display, count }))

  const startOfWeek = new Date(now)
  const dowOffset = (startOfWeek.getUTCDay() === 0 ? -6 : 1 - startOfWeek.getUTCDay())
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() + dowOffset)
  startOfWeek.setUTCHours(0, 0, 0, 0)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' }
  const dayCounts = {}
  days.forEach(day => { dayCounts[day] = 0 })
  incidents.forEach(i => {
    const d = toDate(i.createdAt)
    if (d && d >= startOfWeek) dayCounts[dayMap[d.getUTCDay()]]++
  })
  const incidentsByDay = days.map(day => ({ day, incidents: dayCounts[day] }))

  const weekData = {}
  for (let i = 0; i < 4; i++) {
    weekData[`Week ${i + 1}`] = { ackTotal: 0, ackCount: 0, resolutionTotal: 0, resolutionCount: 0 }
  }

  incidents.forEach(i => {
    const d = toDate(i.createdAt)
    if (!d) return
    const weekNumber = Math.floor((now - d) / (7 * 24 * 60 * 60 * 1000)) + 1
    if (weekNumber < 1 || weekNumber > 4) return

    const key = `Week ${5 - weekNumber}`
    const ackTime = getAcknowledgementTime(i)
    const resolutionTime = getResolutionTime(i)

    if (ackTime !== null) {
      weekData[key].ackTotal += ackTime
      weekData[key].ackCount++
    }

    if (resolutionTime !== null) {
      weekData[key].resolutionTotal += resolutionTime
      weekData[key].resolutionCount++
    }
  })

  const responseTimeData = Object.entries(weekData).map(([week, d]) => ({
    week,
    avgAckMinutes: d.ackCount > 0 ? parseFloat((d.ackTotal / d.ackCount).toFixed(1)) : 0,
    avgResolutionMinutes: d.resolutionCount > 0 ? parseFloat((d.resolutionTotal / d.resolutionCount).toFixed(1)) : 0,
  }))

  const priorityOrder = ['critical', 'high', 'medium', 'low']
  const priorityCounts = {}
  priorityOrder.forEach(priority => { priorityCounts[priority] = 0 })
  incidents.forEach(i => {
    const priority = (i.priority || '').toLowerCase()
    if (priorityCounts[priority] !== undefined) priorityCounts[priority]++
  })
  const incidentsByPriority = priorityOrder.map(priority => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count: priorityCounts[priority],
  }))

  const failedAlerts = includeFailedAlerts ? await getFailedAlerts(db, schoolId) : undefined

  return {
    summary: {
      totalIncidents,
      resolvedCount,
      avgResponseTime: avgAckTime,
      avgAckTime,
      thisWeekIncidents,
      unacknowledgedCount,
      activeIncidents: activeIncidents.length,
      criticalCount,
      highCount,
      ...(includeFailedAlerts ? { failedAlerts: failedAlerts.total } : {}),
    },
    incidentsByType,
    statusBreakdown,
    locationData,
    incidentsByDay,
    responseTimeData,
    incidentsByPriority,
    ...(includeFailedAlerts ? { failedAlerts } : {}),
  }
}

async function getAnalytics(options = {}) {
  const cacheKey = JSON.stringify({
    schoolId: options.schoolId || null,
    includeFailedAlerts: Boolean(options.includeFailedAlerts),
  })

  if (!cacheIsDirty && cachedData.has(cacheKey)) {
    console.log('Analytics served from cache')
    return cachedData.get(cacheKey)
  }

  console.log('Analytics cache miss - rebuilding from Firestore')
  const data = await buildAnalytics(options)
  cachedData.set(cacheKey, data)
  cacheIsDirty = false
  return data
}

function invalidateAnalyticsCache() {
  cacheIsDirty = true
  cachedData.clear()
  console.log('Analytics cache invalidated')
}

module.exports = { getAnalytics, invalidateAnalyticsCache }
