const express = require('express')
const { getDb, serverTimestamp } = require('../db/firebase')

const router = express.Router()

// Helper: get Date from Firestore Timestamp or ISO string
function toDate(val) {
  if (!val) return null
  if (typeof val.toDate === 'function') return val.toDate()
  const d = new Date(val)
  return isNaN(d) ? null : d
}

// Helper: calculate response time in minutes between createdAt and updatedAt
function getResponseTime(incident) {
  if (incident.status !== 'resolved') return null
  const created = toDate(incident.createdAt)
  const updated = toDate(incident.updatedAt)
  if (!created || !updated) return null
  const mins = (updated - created) / 60000
  return mins > 0 ? mins : null
}

// GET /api/analytics/summary
// Returns: total incidents, resolved count, avg response time, this week count
router.get('/summary', async (req, res, next) => {
  try {
    const db = getDb()
    const incidentsRef = db.collection('incidents')
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get all incidents
    const allSnapshot = await incidentsRef.get()
    const allIncidents = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Calculate metrics
    const totalIncidents = allIncidents.length
    const resolvedCount = allIncidents.filter(i => i.status === 'resolved').length

    // Calculate average response time from createdAt vs updatedAt
    const responseTimes = allIncidents.map(getResponseTime).filter(v => v !== null)
    const avgResponseTime = responseTimes.length > 0
      ? (responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length).toFixed(1)
      : 0

    // This week incidents
    const thisWeekIncidents = allIncidents.filter(i => {
      const incidentDate = toDate(i.createdAt)
      return incidentDate && incidentDate >= weekAgo
    }).length

    res.json({
      totalIncidents,
      resolvedCount,
      avgResponseTime: parseFloat(avgResponseTime),
      thisWeekIncidents,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/by-type
// Returns: incidents grouped by type with counts
router.get('/by-type', async (req, res, next) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('incidents').get()
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const typeCounts = {}
    incidents.forEach(incident => {
      const type = incident.type?.charAt(0).toUpperCase() + incident.type?.slice(1) || 'Unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    const data = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/status-breakdown
// Returns: incidents grouped by status with counts
router.get('/status-breakdown', async (req, res, next) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('incidents').get()
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const statusMap = {
      'resolved': 'Resolved',
      'acknowledged': 'Acknowledged',
      'triggered': 'Triggered',
      'archived': 'Archived',
    }

    const statusCounts = {}
    Object.values(statusMap).forEach(status => {
      statusCounts[status] = 0
    })

    incidents.forEach(incident => {
      const statusName = statusMap[incident.status] || 'Unknown'
      statusCounts[statusName] = (statusCounts[statusName] || 0) + 1
    })

    const data = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/by-location
// Returns: incidents grouped by location with counts
router.get('/by-location', async (req, res, next) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('incidents').get()
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const locationCounts = {}
    incidents.forEach(incident => {
      const location = incident.location || 'Unknown'
      locationCounts[location] = (locationCounts[location] || 0) + 1
    })

    const data = Object.entries(locationCounts).map(([location, count]) => ({ location, count }))
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/this-week
// Returns: incidents grouped by day of the week
router.get('/this-week', async (req, res, next) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('incidents').get()
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const now = new Date()
    // Start of current week — Monday 00:00:00 UTC
    const startOfWeek = new Date(now)
    const day = startOfWeek.getUTCDay()
    const diffToMonday = (day === 0 ? -6 : 1 - day)
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() + diffToMonday)
    startOfWeek.setUTCHours(0, 0, 0, 0)

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' }
    const dayCounts = {}
    days.forEach(d => { dayCounts[d] = 0 })

    incidents.forEach(incident => {
      const incidentDate = toDate(incident.createdAt)
      if (incidentDate && incidentDate >= startOfWeek && incidentDate <= now) {
        const dayName = dayMap[incidentDate.getUTCDay()]
        dayCounts[dayName]++
      }
    })

    const data = days.map(d => ({ day: d, incidents: dayCounts[d] }))
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/response-time-trend
// Returns: average response time grouped by week
router.get('/response-time-trend', async (req, res, next) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('incidents').get()
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const now = new Date()
    const weekData = {}

    for (let i = 0; i < 4; i++) {
      weekData[`Week ${i + 1}`] = { total: 0, count: 0 }
    }

    incidents.forEach(incident => {
      const incidentDate = toDate(incident.createdAt)
      const weekNumber = Math.floor((now - incidentDate) / (7 * 24 * 60 * 60 * 1000)) + 1

      if (weekNumber >= 1 && weekNumber <= 4) {
        const weekKey = `Week ${5 - weekNumber}`
        if (weekData[weekKey]) {
          const rt = getResponseTime(incident)
          if (rt !== null) { weekData[weekKey].total += rt; weekData[weekKey].count++ }
        }
      }
    })

    const data = Object.entries(weekData).map(([week, data]) => ({
      week,
      avgMinutes: data.count > 0 ? (data.total / data.count).toFixed(1) : 0,
    }))

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/all
// Returns: all analytics data in one response
router.get('/all', async (req, res, next) => {
  try {
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
      ? (allResponseTimes.reduce((sum, v) => sum + v, 0) / allResponseTimes.length).toFixed(1)
      : 0
    const thisWeekIncidents = incidents.filter(i => {
      const incidentDate = toDate(i.createdAt)
      return incidentDate && incidentDate >= weekAgo
    }).length

    // By type
    const typeCounts = {}
    incidents.forEach(incident => {
      const type = incident.type?.charAt(0).toUpperCase() + incident.type?.slice(1) || 'Unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    const incidentsByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

    // Status breakdown
    const statusMap = {
      'resolved': 'Resolved',
      'acknowledged': 'Acknowledged',
      'triggered': 'Triggered',
      'archived': 'Archived',
    }
    const statusCounts = {}
    Object.values(statusMap).forEach(status => {
      statusCounts[status] = 0
    })
    incidents.forEach(incident => {
      const statusName = statusMap[incident.status] || 'Unknown'
      statusCounts[statusName] = (statusCounts[statusName] || 0) + 1
    })
    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

    // By location
    const locationCounts = {}
    incidents.forEach(incident => {
      const location = incident.location || 'Unknown'
      locationCounts[location] = (locationCounts[location] || 0) + 1
    })
    const locationData = Object.entries(locationCounts).map(([location, count]) => ({ location, count }))

    // This week by day — from Monday 00:00 UTC to now
    const startOfWeek = new Date(now)
    const dowOffset = (startOfWeek.getUTCDay() === 0 ? -6 : 1 - startOfWeek.getUTCDay())
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() + dowOffset)
    startOfWeek.setUTCHours(0, 0, 0, 0)

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' }
    const dayCounts = {}
    days.forEach(d => { dayCounts[d] = 0 })
    incidents.forEach(incident => {
      const incidentDate = toDate(incident.createdAt)
      if (incidentDate && incidentDate >= startOfWeek) {
        dayCounts[dayMap[incidentDate.getUTCDay()]]++
      }
    })
    const incidentsByDay = days.map(d => ({ day: d, incidents: dayCounts[d] }))

    // Response time trend
    const weekData = {}
    for (let i = 0; i < 4; i++) {
      weekData[`Week ${i + 1}`] = { total: 0, count: 0 }
    }
    incidents.forEach(incident => {
      const incidentDate = toDate(incident.createdAt)
      const weekNumber = Math.floor((now - incidentDate) / (7 * 24 * 60 * 60 * 1000)) + 1
      if (weekNumber >= 1 && weekNumber <= 4) {
        const weekKey = `Week ${5 - weekNumber}`
        if (weekData[weekKey]) {
          const rt = getResponseTime(incident)
          if (rt !== null) { weekData[weekKey].total += rt; weekData[weekKey].count++ }
        }
      }
    })
    const responseTimeData = Object.entries(weekData).map(([week, data]) => ({
      week,
      avgMinutes: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
    }))

    res.json({
      summary: {
        totalIncidents,
        resolvedCount,
        avgResponseTime: parseFloat(avgResponseTime),
        thisWeekIncidents,
      },
      incidentsByType,
      statusBreakdown,
      locationData,
      incidentsByDay,
      responseTimeData,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
