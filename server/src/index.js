//loads values from .env into process.env
require('dotenv').config()


const express = require('express')
const cors = require('cors')
const { initFirebase } = require('./db/firebase')
// different route modules for each feature area
const authRoutes = require('./routes/auth')
const incidentRoutes = require('./routes/incidents')
const notificationRoutes = require('./routes/notifications')
const analyticsRoutes = require('./routes/analytics')
const actionLogRoutes = require('./routes/actionLogs')
//app setup
const app = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], //allow frontend dev servers to access the API
  credentials: true,//allow cookies to be sent for authentication
}))
app.use(express.json())//parse JSON request bodies

// ── Initialise Firebase ───────────────────────────────────────────────────────
initFirebase()

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/action-logs', actionLogRoutes)
//simple route to check whether the backend is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
//catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` })
})
//global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error.' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
//start the server
app.listen(PORT, () => {
  console.log(`🚀 SCOUT backend running at http://localhost:${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
})
