const express = require('express')
const {
  docToObject,
  formatTimestamp,
  getDb,
  snapshotToArray,
  serverTimestamp,
} = require('../db/firebase')

const router = express.Router()

function getSortValue(incident) {
  const value = incident.createdAt || incident.updatedAt || incident.timestamp

  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

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

// GET all incidents
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await getDb().collection('incidents').get()

    const incidents = snapshotToArray(snapshot)
      .sort((left, right) => getSortValue(right) - getSortValue(left))
      .map(toIncidentResponse)

    res.json({ incidents })
  } catch (error) {
    next(error)
  }
})

// GET single incident
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

    const notifications = snapshotToArray(notificationsSnapshot).map(notification => ({
      recipientName: notification.recipientName || 'Unknown recipient',
      sms: notification.smsStatus || 'pending',
      email: notification.emailStatus || 'pending',
    }))

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

// POST create incident
router.post('/', async (req, res, next) => {
  try {
    const { type, priority, title, description, location, triggeredByName } = req.body

    if (!type || !priority || !title || !location) {
      return res.status(400).json({
        error: 'Type, priority, title, and location are required.',
      })
    }

    const payload = {
      type,
      priority,
      status: 'triggered',
      title: title.trim(),
      description: description?.trim() || '',
      location,
      triggeredByName: triggeredByName || 'Admin User',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await getDb().collection('incidents').add(payload)
    const createdDoc = await docRef.get()
    const createdIncident = docToObject(createdDoc)

    res.status(201).json({
      incident: toIncidentResponse(createdIncident),
    })
  } catch (error) {
    next(error)
  }
})

// PATCH update incident status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body

    const allowedStatuses = [
      'triggered',
      'acknowledged',
      'in-progress',
      'resolved',
      'archived',
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' })
    }

    const docRef = getDb().collection('incidents').doc(req.params.id)
    const existingDoc = await docRef.get()

    if (!existingDoc.exists) {
      return res.status(404).json({ error: 'Incident not found.' })
    }

    await docRef.update({
      status,
      updatedAt: serverTimestamp(),
    })

    const updatedDoc = await docRef.get()
    const updatedIncident = docToObject(updatedDoc)

    res.json({
      incident: toIncidentResponse(updatedIncident),
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router