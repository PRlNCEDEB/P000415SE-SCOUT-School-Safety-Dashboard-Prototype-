const express = require('express')
const { getDb, serverTimestamp } = require('../db/firebase')

const router = express.Router()

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

    // Calculate average response time
    const incidentsWithResponseTime = allIncidents.filter(i => i.responseTime)
    const avgResponseTime = incidentsWithResponseTime.length > 0
      ? (incidentsWithResponseTime.reduce((sum, i) => sum + (i.responseTime || 0), 0) / incidentsWithResponseTime.length).toFixed(1)
      : 0

    // This week incidents
    const thisWeekIncidents = allIncidents.filter(i => {
      const incidentDate = i.timestamp?.toDate?.() || new Date(i.timestamp)
      return incidentDate >= weekAgo
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
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }
    const dayCounts = {}

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      const dayName = dayMap[date.getDay()]
      dayCounts[dayName] = 0
    }

    incidents.forEach(incident => {
      const incidentDate = incident.timestamp?.toDate?.() || new Date(incident.timestamp)
      if (incidentDate >= weekAgo && incidentDate <= now) {
        const dayName = dayMap[incidentDate.getDay()]
        dayCounts[dayName]++
      }
    })

    const data = Object.entries(dayCounts).map(([day, incidents]) => ({ day, incidents }))
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
      const incidentDate = incident.timestamp?.toDate?.() || new Date(incident.timestamp)
      const weekNumber = Math.floor((now - incidentDate) / (7 * 24 * 60 * 60 * 1000)) + 1

      if (weekNumber >= 1 && weekNumber <= 4) {
        const weekKey = `Week ${5 - weekNumber}`
        if (weekData[weekKey]) {
          weekData[weekKey].total += incident.responseTime || 0
          weekData[weekKey].count += incident.responseTime ? 1 : 0
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
    const incidentsWithResponseTime = incidents.filter(i => i.responseTime)
    const avgResponseTime = incidentsWithResponseTime.length > 0
      ? (incidentsWithResponseTime.reduce((sum, i) => sum + (i.responseTime || 0), 0) / incidentsWithResponseTime.length).toFixed(1)
      : 0
    const thisWeekIncidents = incidents.filter(i => {
      const incidentDate = i.timestamp?.toDate?.() || new Date(i.timestamp)
      return incidentDate >= weekAgo
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

    // This week by day
    const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }
    const dayCounts = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      const dayName = dayMap[date.getDay()]
      dayCounts[dayName] = 0
    }
    incidents.forEach(incident => {
      const incidentDate = incident.timestamp?.toDate?.() || new Date(incident.timestamp)
      if (incidentDate >= weekAgo && incidentDate <= now) {
        const dayName = dayMap[incidentDate.getDay()]
        dayCounts[dayName]++
      }
    })
    const incidentsByDay = Object.entries(dayCounts).map(([day, incidents]) => ({ day, incidents }))

    // Response time trend
    const weekData = {}
    for (let i = 0; i < 4; i++) {
      weekData[`Week ${i + 1}`] = { total: 0, count: 0 }
    }
    incidents.forEach(incident => {
      const incidentDate = incident.timestamp?.toDate?.() || new Date(incident.timestamp)
      const weekNumber = Math.floor((now - incidentDate) / (7 * 24 * 60 * 60 * 1000)) + 1
      if (weekNumber >= 1 && weekNumber <= 4) {
        const weekKey = `Week ${5 - weekNumber}`
        if (weekData[weekKey]) {
          weekData[weekKey].total += incident.responseTime || 0
          weekData[weekKey].count += incident.responseTime ? 1 : 0
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
