const express = require('express')
const { getDb, formatTimestamp } = require('../db/firebase')
const authMiddleware = require('./auth')

const router = express.Router()
router.use(authMiddleware)

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const { channel, status } = req.query

    const snapshot = await db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .get()

    let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Filter by channel + status in memory (avoids composite index requirement)
    if (channel === 'sms' && status && status !== 'all') {
      notifications = notifications.filter(n => n.smsStatus === status)
    } else if (channel === 'email' && status && status !== 'all') {
      notifications = notifications.filter(n => n.emailStatus === status)
    } else if ((!channel || channel === 'all') && status && status !== 'all') {
      notifications = notifications.filter(n => n.smsStatus === status || n.emailStatus === status)
    }

    const formatted = notifications.map(n => ({
      id: n.id,
      incidentId: n.incidentId,
      incidentTitle: n.incidentTitle,
      type: n.incidentType,
      recipientName: n.recipientName,
      recipientEmail: n.recipientEmail,
      recipientPhone: n.recipientPhone,
      sms: n.smsStatus,
      email: n.emailStatus,
      timestamp: formatTimestamp(n.createdAt),
    }))

    // Summary (always calculated from full dataset)
    const all = snapshot.docs.map(d => d.data())
    const summary = {
      totalSent: all.filter(n => n.smsStatus === 'sent' || n.emailStatus === 'sent').length,
      totalFailed: all.filter(n => n.smsStatus === 'failed' || n.emailStatus === 'failed').length,
      smsFailed: all.filter(n => n.smsStatus === 'failed').length,
      emailFailed: all.filter(n => n.emailStatus === 'failed').length,
    }

    res.json({ notifications: formatted, summary, total: formatted.length })
  } catch (err) {
    console.error('List notifications error:', err)
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
})

module.exports = router
