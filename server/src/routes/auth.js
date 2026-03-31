const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDb } = require('../db/firebase')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const db = getDb()
    const snapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const userDoc = snapshot.docs[0]
    const user = { id: userDoc.id, ...userDoc.data() }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully.' })
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const doc = await db.collection('users').doc(req.user.id).get()
    if (!doc.exists) return res.status(404).json({ error: 'User not found.' })
    const user = doc.data()
    res.json({ user: { id: doc.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ error: 'Could not fetch user.' })
  }
})

module.exports = router
