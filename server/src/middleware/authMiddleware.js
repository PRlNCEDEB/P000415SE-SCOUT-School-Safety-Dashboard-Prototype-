const jwt = require('jsonwebtoken')

// ── verifyToken middleware ────────────────────────────────────────────────────
// Attach this to any route that requires the user to be logged in.
// It checks the Authorization header for a Bearer token, verifies it,
// and attaches the decoded user payload to req.user.
//
// Usage in a route file:
//   const verifyToken = require('../middleware/authMiddleware')
//   router.get('/protected', verifyToken, (req, res) => { ... })

function verifyToken(req, res, next) {
  // The frontend sends:  Authorization: Bearer <token>
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded   // now available as req.user in every protected route
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' })
    }
    return res.status(403).json({ error: 'Invalid token.' })
  }
}

// ── requireAdmin middleware ───────────────────────────────────────────────────
// Use this on routes only administrators should access (e.g. analytics).
// Always place verifyToken BEFORE requireAdmin in the middleware chain.
//
// Usage:
//   router.get('/admin-only', verifyToken, requireAdmin, (req, res) => { ... })

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrators only.' })
  }
  next()
}

module.exports = verifyToken
module.exports.requireAdmin = requireAdmin