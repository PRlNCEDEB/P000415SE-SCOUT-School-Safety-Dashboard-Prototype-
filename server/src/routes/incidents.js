const express = require('express')
const { docToObject, formatTimestamp, getDb, snapshotToArray } = require('../db/firebase')
const { invalidateAnalyticsCache } = require('../analyticsCache')

const router = express.Router()

function getSortValue(incident) {
  //tries to get a timestamp for sorting based on createdAt, updatedAt, or timestamp fields
  const value = incident.createdAt || incident.updatedAt || incident.timestamp

  if (!value) return 0
  //if it is a Firestore Timestamp, use toMillis() to convert it into a number
  if (typeof value.toMillis === 'function') return value.toMillis()
  //otherwise, try to parse it as a date string and return the timestamp
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
//converts a raw Firestore incident into the response shape used by the frontend
function toIncidentResponse(incident) {
  return {
    id: String(incident.id),
    type: incident.type || 'general',
    priority: incident.priority || 'low',
    status: incident.status || 'triggered',
    title: incident.title || 'Untitled incident',
    location: incident.location || 'Unknown location',
    timestamp: incident.createdAt ? formatTimestamp(incident.createdAt) : '',
    triggeredByName: incident.triggeredByName || 'Unknown reporter',
    description: incident.description || '',
    acknowledgedBy: incident.acknowledgedBy || [],  // ← added
    notifications: [],
  }
}

router.get('/', async (req, res, next) => {
  try {
    const snapshot = await getDb().collection('incidents').get()
    //sorts incidents from newest to oldest based on createdAt, updatedAt, or timestamp and converts to response format
    const incidents = snapshotToArray(snapshot)
      .sort((left, right) => getSortValue(right) - getSortValue(left))
      .map(toIncidentResponse)
    //sends the result back as JSON
    res.json({ incidents })
  } catch (error) {
    next(error)
  }
})
//gets a specific incident by ID
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDb().collection('incidents').doc(req.params.id).get()
    const incident = docToObject(doc)

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' })
    }

    const notificationsSnapshot = await getDb()
      .collection('notifications')
      .where('incidentId', '==', req.params.id)
      .get()
    //converts each notification into a smaller response object
    const notifications = snapshotToArray(notificationsSnapshot).map(notification => ({
      recipientName: notification.recipientName || 'Unknown recipient',
      sms: notification.sms || notification.smsStatus || 'pending',      // ← fixed
      email: notification.email || notification.emailStatus || 'pending', // ← fixed
    }))
    //returns the incident details
    res.json({
      incident: {
        ...toIncidentResponse(incident),
        notifications,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { type, priority, status, title, location, description, triggeredByName, triggeredById } = req.body
    const now = new Date().toISOString()

    const docRef = await getDb().collection('incidents').add({
      type: type || 'general',
      priority: priority || 'low',
      status: status || 'triggered',
      title: title || 'Untitled incident',
      location: location || 'Unknown',
      description: description || '',
      triggeredByName: triggeredByName || 'Unknown',
      triggeredById: triggeredById || null,
      createdAt: now,
      updatedAt: now,
    })

    const doc = await docRef.get()
    const incident = { id: doc.id, ...doc.data() }
    invalidateAnalyticsCache()
    res.status(201).json(toIncidentResponse(incident))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const now = new Date().toISOString()
    await getDb().collection('incidents').doc(req.params.id).update({ status, updatedAt: now })
    invalidateAnalyticsCache()
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

module.exports = router
module.exports.getSortValue = getSortValue
module.exports.toIncidentResponse = toIncidentResponse
