const express = require('express')
const admin = require('firebase-admin')
const { getDb } = require('../db/firebase')
const { runArchiveJob } = require('../archiver')

const router = express.Router()

const SETTINGS_DOC = 'settings/global'
const DEFAULT_OVERDUE_THRESHOLD_MINUTES = 15
const DEFAULT_ARCHIVE_RETENTION_DAYS = 30

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' })
  }

  try {
    req.user = await admin.auth().verifyIdToken(token)
    next()
  } catch (err) {
    console.error('Firebase token verification failed:', err.code, err.message)
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

function normaliseRole(role) {
  return String(role || '').toLowerCase().replace(/[-_\s]/g, '')
}

function isCompanyAdmin(role) {
  return normaliseRole(role) === 'companyadmin'
}

async function getUserRole(uid, email) {
  const db = getDb()
  const userDoc = await db.collection('users').doc(uid).get()

  if (userDoc.exists) {
    return userDoc.data()?.role || null
  }

  if (email) {
    const byEmail = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!byEmail.empty) {
      return byEmail.docs[0].data()?.role || null
    }
  }

  return null
}

// GET /api/settings — any authenticated user may read (needed for overdue computation)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const db = getDb()
    const doc = await db.doc(SETTINGS_DOC).get()
    const data = doc.exists ? doc.data() : {}

    res.json({
      overdueThresholdMinutes: data.overdueThresholdMinutes ?? DEFAULT_OVERDUE_THRESHOLD_MINUTES,
      archiveRetentionDays: data.archiveRetentionDays ?? DEFAULT_ARCHIVE_RETENTION_DAYS,
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/settings — company admin only
router.patch('/', verifyToken, async (req, res, next) => {
  try {
    const role = await getUserRole(req.user.uid, req.user.email)

    if (!isCompanyAdmin(role)) {
      return res.status(403).json({ error: 'Only Company Admins can update system settings.' })
    }

    const { overdueThresholdMinutes, archiveRetentionDays } = req.body
    const updates = {}

    if (overdueThresholdMinutes !== undefined) {
      if (
        typeof overdueThresholdMinutes !== 'number' ||
        !Number.isInteger(overdueThresholdMinutes) ||
        overdueThresholdMinutes < 1 ||
        overdueThresholdMinutes > 1440
      ) {
        return res.status(400).json({
          error: 'overdueThresholdMinutes must be a whole number between 1 and 1440.',
        })
      }
      updates.overdueThresholdMinutes = overdueThresholdMinutes
    }

    if (archiveRetentionDays !== undefined) {
      if (
        typeof archiveRetentionDays !== 'number' ||
        !Number.isInteger(archiveRetentionDays) ||
        archiveRetentionDays < 1 ||
        archiveRetentionDays > 365
      ) {
        return res.status(400).json({
          error: 'archiveRetentionDays must be a whole number between 1 and 365.',
        })
      }
      updates.archiveRetentionDays = archiveRetentionDays
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid settings fields provided.' })
    }

    const db = getDb()
    await db.doc(SETTINGS_DOC).set(updates, { merge: true })

    res.json({ success: true, ...updates })
  } catch (error) {
    next(error)
  }
})

// POST /api/settings/archive — company admin manually triggers the archive job
router.post('/archive', verifyToken, async (req, res, next) => {
  try {
    const role = await getUserRole(req.user.uid, req.user.email)

    if (!isCompanyAdmin(role)) {
      return res.status(403).json({ error: 'Only Company Admins can trigger archiving.' })
    }

    const result = await runArchiveJob()
    res.json({ success: true, archived: result.archived })
  } catch (error) {
    next(error)
  }
})

module.exports = router
