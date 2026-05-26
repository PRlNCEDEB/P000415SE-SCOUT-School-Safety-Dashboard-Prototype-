const express = require('express')
const admin = require('firebase-admin')
const { getDb } = require('../db/firebase')

const router = express.Router()

const SETTINGS_DOC = 'settings/global'
const DEFAULT_OVERDUE_THRESHOLD_MINUTES = 15

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

    const { overdueThresholdMinutes } = req.body

    if (
      overdueThresholdMinutes === undefined ||
      typeof overdueThresholdMinutes !== 'number' ||
      !Number.isInteger(overdueThresholdMinutes) ||
      overdueThresholdMinutes < 1 ||
      overdueThresholdMinutes > 1440
    ) {
      return res.status(400).json({
        error: 'overdueThresholdMinutes must be a whole number between 1 and 1440.',
      })
    }

    const db = getDb()
    await db.doc(SETTINGS_DOC).set({ overdueThresholdMinutes }, { merge: true })

    res.json({ success: true, overdueThresholdMinutes })
  } catch (error) {
    next(error)
  }
})

module.exports = router
