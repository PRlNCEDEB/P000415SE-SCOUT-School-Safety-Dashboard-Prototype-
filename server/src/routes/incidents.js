const express = require('express')
const {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
} = require('../data/incidents')

const router = express.Router()

const ACTIVE_STATUSES = new Set(['triggered', 'acknowledged', 'in-progress'])
const VALID_STATUSES = new Set(['triggered', 'acknowledged', 'in-progress', 'resolved', 'archived'])
const VALID_PRIORITIES = new Set(['critical', 'high', 'medium', 'low'])

function normaliseText(value = '') {
  return String(value).trim().toLowerCase()
}

router.get('/', (req, res) => {
  const status = normaliseText(req.query.status || 'active')
  const priority = normaliseText(req.query.priority || 'all')
  const search = normaliseText(req.query.search || '')

  let filtered = [...getAllIncidents()]

  if (status === 'active') {
    filtered = filtered.filter((incident) => ACTIVE_STATUSES.has(incident.status))
  } else if (status !== 'all') {
    filtered = filtered.filter((incident) => incident.status === status)
  }

  if (priority !== 'all') {
    filtered = filtered.filter((incident) => incident.priority === priority)
  }

  if (search) {
    filtered = filtered.filter((incident) => {
      const haystack = [incident.title, incident.type, incident.location, incident.status]
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }

  res.json({
    items: filtered,
    total: filtered.length,
    appliedFilters: { status, priority, search },
  })
})

router.get('/:id', (req, res) => {
  const incident = getIncidentById(req.params.id)
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found.' })
  }
  return res.json(incident)
})

router.post('/', (req, res) => {
  const { type, priority, title, location, description, triggeredByName } = req.body || {}

  if (!type || !priority || !title?.trim() || !location) {
    return res.status(400).json({ error: 'type, priority, title, and location are required.' })
  }

  if (!VALID_PRIORITIES.has(priority)) {
    return res.status(400).json({ error: 'Invalid priority value.' })
  }

  const incident = createIncident({ type, priority, title, location, description, triggeredByName })
  return res.status(201).json(incident)
})

router.patch('/:id/status', (req, res) => {
  const status = normaliseText(req.body?.status)
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Invalid status value.' })
  }

  const incident = updateIncidentStatus(req.params.id, status)
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found.' })
  }

  return res.json(incident)
})

module.exports = router
