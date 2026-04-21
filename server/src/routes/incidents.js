const express = require('express')
const { docToObject, formatTimestamp, getDb, snapshotToArray } = require('../db/firebase')

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
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

module.exports = router
