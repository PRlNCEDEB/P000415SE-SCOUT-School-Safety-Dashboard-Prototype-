// analytics.js — All routes now served from in-memory cache.
// Firestore is only read on first request or after an incident changes.
// See analyticsCache.js for the cache logic and Firestore query details.

const express = require('express')
const { getAnalytics } = require('../analyticsCache')

const router = express.Router()

// GET /api/analytics/all — full payload (used by Analytics.jsx)
router.get('/all', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/summary
router.get('/summary', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data.summary)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/by-type
router.get('/by-type', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data.incidentsByType)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/status-breakdown
router.get('/status-breakdown', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data.statusBreakdown)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/by-location
router.get('/by-location', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data.locationData)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/this-week
router.get('/this-week', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data.incidentsByDay)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/response-time-trend
router.get('/response-time-trend', async (req, res, next) => {
  try {
    const data = await getAnalytics()
    res.json(data.responseTimeData)
  } catch (error) {
    next(error)
  }
})

module.exports = router
