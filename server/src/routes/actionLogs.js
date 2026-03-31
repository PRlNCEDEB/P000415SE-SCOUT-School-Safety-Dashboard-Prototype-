const express = require('express')
const { getDb, formatTimestamp } = require('../db/firebase')
const authMiddleware = require('./auth')

const router = express.Router()
router.use(authMiddleware)

function formatLog(id, data) {
  return {
    id,
    button: data.button,
    emergencyType: data.emergencyType || null,
    actions: data.actions,
    title: data.title || '',
    description: data.description || '',
    location: data.location || '',
    timestamp: formatTimestamp(data.createdAt),
    createdAt: data.createdAt,
  }
}

// GET /api/action-logs
router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('actionLogs')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const logs = snapshot.docs.map(doc => formatLog(doc.id, doc.data()))
    res.json({ logs })
  } catch (err) {
    console.error('List action logs error:', err)
    res.status(500).json({ error: 'Failed to fetch action logs.' })
  }
})

// POST /api/action-logs
router.post('/', async (req, res) => {
  try {
    const { button, emergencyType, actions, title, description, location } = req.body

    if (!button || !['1', '2'].includes(String(button)))
      return res.status(400).json({ error: 'Button must be "1" or "2".' })
    if (!actions || !Array.isArray(actions) || actions.length === 0)
      return res.status(400).json({ error: 'Actions array is required.' })

    const db = getDb()
    const logData = {
      button: String(button),
      emergencyType: emergencyType || null,
      actions,
      title: title?.trim() || null,
      description: description?.trim() || null,
      location: location?.trim() || null,
      triggeredById: req.user.id,
      createdAt: new Date().toISOString(),
    }

    const ref = await db.collection('actionLogs').add(logData)
    res.status(201).json(formatLog(ref.id, logData))
  } catch (err) {
    console.error('Create action log error:', err)
    res.status(500).json({ error: 'Failed to create action log.' })
  }
})

// PATCH /api/action-logs/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, description, location } = req.body
    const db = getDb()
    const ref = db.collection('actionLogs').doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) return res.status(404).json({ error: 'Action log not found.' })

    const updates = {}
    if (title !== undefined) updates.title = title?.trim() || null
    if (description !== undefined) updates.description = description?.trim() || null
    if (location !== undefined) updates.location = location?.trim() || null

    await ref.update(updates)
    const updated = await ref.get()
    res.json(formatLog(updated.id, updated.data()))
  } catch (err) {
    console.error('Update action log error:', err)
    res.status(500).json({ error: 'Failed to update action log.' })
  }
})

module.exports = router
