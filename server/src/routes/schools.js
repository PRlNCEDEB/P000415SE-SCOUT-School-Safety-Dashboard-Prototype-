const express = require('express')
const admin = require('firebase-admin')
const { getDb } = require('../db/firebase')
const { getSchoolCacheVersion } = require('../schoolCache')
const {
  SchoolServiceError,
  createSchool,
  getSchoolById,
  listSchoolsForProfile,
  normaliseRole,
  renameSchool,
  setSchoolActive,
} = require('../services/schoolService')

const router = express.Router()

// ── Middleware ────────────────────────────────────────────────────────────────

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return res.status(401).json({ error: 'No token provided.' })

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

  const userDoc = await db.collection('users').doc(uid).get()
  if (userDoc.exists) return { uid, ...userDoc.data() }

  if (email) {
    const byEmail = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!byEmail.empty) return { uid, ...byEmail.docs[0].data() }
  }

  return { uid, email, role: 'staff' }
}

// Loads the caller's profile onto req for every route in this router.
async function attachProfile(req, res, next) {
  try {
    req.profile = await getUserProfile(req.user)
    next()
  } catch (err) {
    next(err)
  }
}

// Creating, renaming and deactivating schools is a Company Admin operation.
// School Admins manage settings *within* their school, not the school list.
function requireCompanyAdmin(req, res, next) {
  if (normaliseRole(req.profile?.role) !== 'companyadmin') {
    return res.status(403).json({ error: 'Company Admin access required.' })
  }
  next()
}

// Translates SchoolServiceError into its HTTP status; anything else is a real
// fault and goes to the global error handler.
function handleServiceError(err, res, next) {
  if (err instanceof SchoolServiceError) {
    return res.status(err.status).json({ error: err.message, code: err.code })
  }
  return next(err)
}

function parseBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/schools
//
// Role-scoped: Company Admin receives every school, everyone else receives only
// the school they belong to. Any authenticated user may call it  the dropdowns,
// dashboard headers and analytics banners all need school names.
//
// `version` increments whenever a school is created, renamed or deactivated, so
// a polling client can detect a change without diffing the payload.
router.get('/', verifyToken, attachProfile, async (req, res, next) => {
  try {
    const includeInactive = parseBoolean(req.query.includeInactive)

    // Only a Company Admin may see deactivated schools; for anyone else the
    // flag is ignored rather than rejected, so the client can send it blindly.
    const schools = await listSchoolsForProfile(req.profile, {
      includeInactive: includeInactive && normaliseRole(req.profile?.role) === 'companyadmin',
    })

    res.json({ schools, version: getSchoolCacheVersion() })
  } catch (err) {
    handleServiceError(err, res, next)
  }
})

// GET /api/schools/:id
router.get('/:id', verifyToken, attachProfile, async (req, res, next) => {
  try {
    const school = await getSchoolById(req.params.id)
    if (!school) return res.status(404).json({ error: 'School not found.' })

    // Non Company Admins may only read their own school.
    if (normaliseRole(req.profile?.role) !== 'companyadmin' && req.profile?.schoolId !== school.id) {
      return res.status(403).json({ error: 'You do not have access to this school.' })
    }

    res.json({ school })
  } catch (err) {
    handleServiceError(err, res, next)
  }
})

// POST /api/schools  Company Admin only
router.post('/', verifyToken, attachProfile, requireCompanyAdmin, async (req, res, next) => {
  try {
    const school = await createSchool({ name: req.body?.name })
    res.status(201).json({ school, version: getSchoolCacheVersion() })
  } catch (err) {
    handleServiceError(err, res, next)
  }
})

// PUT /api/schools/:id  Company Admin only
//
// Renaming propagates the new name to every collection that denormalises
// schoolName; the response reports how many documents were rewritten.
router.put('/:id', verifyToken, attachProfile, requireCompanyAdmin, async (req, res, next) => {
  try {
    const result = await renameSchool(req.params.id, { name: req.body?.name })

    res.json({
      school: result.school,
      propagated: result.propagated,
      changed: result.changed,
      version: getSchoolCacheVersion(),
    })
  } catch (err) {
    handleServiceError(err, res, next)
  }
})

// PATCH /api/schools/:id/active  Company Admin only
//
// Soft delete. Schools are never removed, because incidents, users and routing
// rules reference schoolId and would be orphaned.
router.patch('/:id/active', verifyToken, attachProfile, requireCompanyAdmin, async (req, res, next) => {
  try {
    if (typeof req.body?.active !== 'boolean') {
      return res.status(400).json({ error: 'active must be true or false.' })
    }

    const school = await setSchoolActive(req.params.id, req.body.active)
    res.json({ school, version: getSchoolCacheVersion() })
  } catch (err) {
    handleServiceError(err, res, next)
  }
})

module.exports = router
