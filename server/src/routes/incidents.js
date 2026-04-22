const express = require('express')
const { docToObject, formatTimestamp, getDb, snapshotToArray } = require('../db/firebase')

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
      sms: notification.smsStatus || 'pending',
      email: notification.emailStatus || 'pending',
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

module.exports = router
