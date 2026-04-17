const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDb } = require('../db/firebase')

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // Find user in Firestore by email
    const snapshot = await getDb()
      .collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const doc = snapshot.docs[0]
    const user = { id: doc.id, ...doc.data() }

    // Verify password against stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Issue JWT token (expires in 8 hours)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    // Return safe user data (no password hash)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/logout  (frontend just needs an endpoint to call)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out.' })
})

module.exports = router