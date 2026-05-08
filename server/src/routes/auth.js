const express = require('express')
const admin = require('firebase-admin')
const { getDb } = require('../db/firebase')

const router = express.Router()

// ── Middleware: verify Firebase ID token ──────────────────────────────────────
// Extracts the Bearer token from the Authorization header,
// verifies it with Firebase Admin SDK, and attaches the decoded token to req.
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded // { uid, email, ... }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

// ── GET /api/auth/role ────────────────────────────────────────────────────────
// Returns the role, schoolId, and name of the currently authenticated user.
// The client calls this after Firebase login to establish role + school scope.
router.get('/role', verifyToken, async (req, res) => {
  try {
    const db = getDb()
    const { uid, email } = req.user

    const pick = (data) => ({
      role:     data.role     || 'staff',
      schoolId: data.schoolId || null,
      name:     data.name     || null,
    })

    // Look up the user document in Firestore by UID
    const userDoc = await db.collection('users').doc(uid).get()
    if (userDoc.exists) {
      return res.json(pick(userDoc.data()))
    }

    // Fallback: search by email if UID doc not found
    const byEmail = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!byEmail.empty) {
      return res.json(pick(byEmail.docs[0].data()))
    }

    // User authenticated but no Firestore record — default to staff
    return res.json({ role: 'staff', schoolId: null, name: null })

  } catch (err) {
    console.error('Error fetching user role:', err)
    return res.status(500).json({ error: 'Failed to fetch role.' })
  }
})

module.exports = router
