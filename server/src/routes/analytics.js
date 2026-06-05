// analytics.js - Role-protected analytics routes.

const express = require('express')
const admin = require('firebase-admin')
const { getDb } = require('../db/firebase')
const { getAnalytics, getTrends } = require('../analyticsCache')

const router = express.Router()

function normaliseRole(role) {
  return String(role || '').toLowerCase().replace(/[-_\s]/g, '')
}

function isCompanyAdmin(role) {
  return normaliseRole(role) === 'companyadmin'
}

function isSchoolAdmin(role) {
  return normaliseRole(role) === 'schooladmin'
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' })
  }

  try {
    req.user = await admin.auth().verifyIdToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

async function getUserProfile(decodedUser) {
  const db = getDb()
  const { uid, email } = decodedUser
  let profile = null

  const userDoc = await db.collection('users').doc(uid).get()
  if (userDoc.exists) {
    profile = userDoc.data()
  } else if (email) {
    const byEmail = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!byEmail.empty) {
      profile = byEmail.docs[0].data()
    }
  }

  return {
    uid,
    email: email || null,
    role: profile?.role || null,
    schoolId: profile?.schoolId || null,
  }
}

async function requireAnalyticsViewer(req, res, next) {
  try {
    const profile = await getUserProfile(req.user)

    if (!isCompanyAdmin(profile.role) && !isSchoolAdmin(profile.role)) {
      return res.status(403).json({ error: 'You do not have permission to view analytics.' })
    }

    if (isSchoolAdmin(profile.role) && !profile.schoolId) {
      return res.status(403).json({ error: 'Your account is not assigned to a school.' })
    }

    req.profile = profile
    next()
  } catch (error) {
    console.error('Failed to verify analytics viewer:', error)
    return res.status(500).json({ error: 'Failed to verify analytics viewer.' })
  }
}

function getAnalyticsOptions(profile) {
  if (isCompanyAdmin(profile.role)) {
    return { includeFailedAlerts: true }
  }

  return {
    schoolId: profile.schoolId,
    includeFailedAlerts: true,
  }
}

router.use(verifyToken, requireAnalyticsViewer)

router.get('/all', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data)
  } catch (error) {
    next(error)
  }
})

router.get('/summary', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data.summary)
  } catch (error) {
    next(error)
  }
})

router.get('/by-type', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data.incidentsByType)
  } catch (error) {
    next(error)
  }
})

router.get('/status-breakdown', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data.statusBreakdown)
  } catch (error) {
    next(error)
  }
})

router.get('/by-location', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data.locationData)
  } catch (error) {
    next(error)
  }
})

router.get('/this-week', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data.incidentsByDay)
  } catch (error) {
    next(error)
  }
})

router.get('/response-time-trend', async (req, res, next) => {
  try {
    const data = await getAnalytics(getAnalyticsOptions(req.profile))
    res.json(data.responseTimeData)
  } catch (error) {
    next(error)
  }
})

const VALID_TREND_RANGES = ['week', 'month', 'quarter', 'year', 'all']

router.get('/trends', async (req, res, next) => {
  try {
    const range = VALID_TREND_RANGES.includes(req.query.range) ? req.query.range : 'week'
    const opts = getAnalyticsOptions(req.profile)
    const data = await getTrends({ schoolId: opts.schoolId || null, range })
    res.json(data)
  } catch (error) {
    next(error)
  }
})

module.exports = router
