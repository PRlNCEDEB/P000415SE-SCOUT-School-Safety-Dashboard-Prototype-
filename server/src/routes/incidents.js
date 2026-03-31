const express = require('express')
const { getDb, formatTimestamp } = require('../db/firebase')
const authMiddleware = require('./auth')

const router = express.Router()
router.use(authMiddleware)

function formatIncident(id, data, notifications = []) {
  return {
    id,
    type: data.type,
    priority: data.priority,
    status: data.status,
    title: data.title,
    location: data.location,
    description: data.description || '',
    triggeredByName: data.triggeredByName || 'Unknown',
    timestamp: formatTimestamp(data.createdAt),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    notifications: notifications.map(n => ({
      recipientName: n.recipientName,
      recipientEmail: n.recipientEmail,
      recipientPhone: n.recipientPhone,
      sms: n.smsStatus,
      email: n.emailStatus,
    })),
  }
}

// GET /api/incidents
router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const { status, priority, search } = req.query

    let query = db.collection('incidents').orderBy('createdAt', 'desc')

    // Firestore only supports equality filters with orderBy without composite index tricks
    // so we filter status/priority server-side and search client-side
    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (priority && priority !== 'all') {
      query = query.where('priority', '==', priority)
    }

    const snapshot = await query.get()
    let incidents = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }))

    // Search filter (Firestore doesn't support LIKE — do it in memory)
    if (search) {
      const q = search.toLowerCase()
      incidents = incidents.filter(i =>
        i.title?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q)
      )
    }

    // Fetch notifications for each incident in parallel
    const result = await Promise.all(
      incidents.map(async incident => {
        const notifSnap = await db.collection('notifications')
          .where('incidentId', '==', incident._id)
          .get()
        const notifications = notifSnap.docs.map(d => d.data())
        return formatIncident(incident._id, incident, notifications)
      })
    )

    res.json({ incidents: result, total: result.length })
  } catch (err) {
    console.error('List incidents error:', err)
    res.status(500).json({ error: 'Failed to fetch incidents.' })
  }
})

// GET /api/incidents/:id
router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const doc = await db.collection('incidents').doc(req.params.id).get()

    if (!doc.exists) return res.status(404).json({ error: 'Incident not found.' })

    const notifSnap = await db.collection('notifications')
      .where('incidentId', '==', req.params.id)
      .get()
    const notifications = notifSnap.docs.map(d => d.data())

    res.json(formatIncident(doc.id, doc.data(), notifications))
  } catch (err) {
    console.error('Get incident error:', err)
    res.status(500).json({ error: 'Failed to fetch incident.' })
  }
})

// POST /api/incidents
router.post('/', async (req, res) => {
  try {
    const { type, priority, title, location, description } = req.body

    const validTypes = ['medical', 'fire', 'lockdown', 'behaviour', 'weather', 'maintenance', 'general']
    const validPriorities = ['critical', 'high', 'medium', 'low']

    if (!type || !validTypes.includes(type))
      return res.status(400).json({ error: 'Invalid or missing alert type.' })
    if (!priority || !validPriorities.includes(priority))
      return res.status(400).json({ error: 'Invalid or missing priority.' })
    if (!title?.trim())
      return res.status(400).json({ error: 'Title is required.' })
    if (!location?.trim())
      return res.status(400).json({ error: 'Location is required.' })

    const db = getDb()
    const now = new Date().toISOString()

    const incidentData = {
      type,
      priority,
      status: 'triggered',
      title: title.trim(),
      location: location.trim(),
      description: description?.trim() || null,
      triggeredById: req.user.id,
      triggeredByName: req.user.name,
      createdAt: now,
      updatedAt: now,
    }

    const ref = await db.collection('incidents').add(incidentData)
    res.status(201).json(formatIncident(ref.id, incidentData, []))
  } catch (err) {
    console.error('Create incident error:', err)
    res.status(500).json({ error: 'Failed to create incident.' })
  }
})

// PATCH /api/incidents/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['triggered', 'acknowledged', 'resolved', 'archived']

    if (!status || !validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status value.' })

    const db = getDb()
    const ref = db.collection('incidents').doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) return res.status(404).json({ error: 'Incident not found.' })

    const current = doc.data()
    const transitions = {
      triggered: 'acknowledged',
      acknowledged: 'resolved',
      resolved: 'archived',
    }

    if (transitions[current.status] !== status) {
      return res.status(400).json({
        error: `Cannot transition from '${current.status}' to '${status}'.`,
      })
    }

    const now = new Date().toISOString()
    await ref.update({ status, updatedAt: now })

    const notifSnap = await db.collection('notifications')
      .where('incidentId', '==', req.params.id)
      .get()
    const notifications = notifSnap.docs.map(d => d.data())

    res.json(formatIncident(req.params.id, { ...current, status, updatedAt: now }, notifications))
  } catch (err) {
    console.error('Update status error:', err)
    res.status(500).json({ error: 'Failed to update status.' })
  }
})

module.exports = router
