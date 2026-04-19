const express = require('express')
const jwt = require('jsonwebtoken')
const { getDb } = require('../db/firebase')

const router = express.Router()

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Accepts { email, password } and returns a JWT token if credentials are valid.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Basic input check
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // 2. Look up the user in Firestore by email
    const db = getDb()
    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('email', '==', email.toLowerCase().trim()).limit(1).get()

    if (snapshot.empty) {
      // Return the same error message for both "user not found" and "wrong password"
      // so attackers cannot tell which one it is
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    // 3. Check if the account is active
    if (userData.isActive === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your Safety Manager.' })
    }

    // 4. Verify password
    //    Passwords in Firestore must be stored as bcrypt hashes.
    //    For now we also support a plain-text check so the seed data works during development.
    let passwordValid = false

    if (userData.password) {
      // Try bcrypt first (production-style hashed password)
      try {
        const bcrypt = require('bcryptjs')
        passwordValid = await bcrypt.compare(password, userData.password)
      } catch {
        // If bcrypt fails (e.g. plain text in dev seed), fall back to direct comparison
        passwordValid = userData.password === password
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // 5. Build the JWT payload — only include non-sensitive fields
    const payload = {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
    }

    // 6. Sign the token (expires in 8 hours — a school work day)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' })

    // 7. Return the token and basic user info to the frontend
    return res.status(200).json({
      token,
      user: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'user',
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Returns the currently logged-in user's info based on their token.
// The frontend can call this on page load to restore a session.
router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    const db = getDb()
    const userDoc = await db.collection('users').doc(req.user.uid).get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const userData = userDoc.data()
    return res.status(200).json({
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
    })
  } catch (err) {
    console.error('Auth/me error:', err)
    return res.status(500).json({ error: 'Could not retrieve user.' })
  }
})

module.exports = router