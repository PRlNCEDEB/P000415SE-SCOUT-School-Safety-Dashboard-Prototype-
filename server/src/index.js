require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initFirebase } = require('./db/firebase')
const { seedDemoAnalyticsData } = require('./db/seedDemoAnalytics')

const authRoutes = require('./routes/auth')
const incidentRoutes = require('./routes/incidents')
const notificationRoutes = require('./routes/notifications')
const analyticsRoutes = require('./routes/analytics')
const actionLogRoutes = require('./routes/actionLogs')

const app = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}))
app.use(express.json())

// ── Initialise Firebase ───────────────────────────────────────────────────────
initFirebase()

// ── Seed analytics data (runs once) ───────────────────────────────────────────
seedDemoAnalyticsData().catch(err => console.error('Failed to seed analytics:', err))

// ── Routes ────────────────────────────────────────────────────────────────────
//app.use('/api/auth', authRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/action-logs', actionLogRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error.' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 SCOUT backend running at http://localhost:${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
})
