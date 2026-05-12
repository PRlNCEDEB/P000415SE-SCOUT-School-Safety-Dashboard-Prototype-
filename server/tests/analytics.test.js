const test = require('node:test')
const assert = require('node:assert')

function calculateIncidentSummary(incidents = []) {
  return {
    total: incidents.length,
    active: incidents.filter(
      incident => incident.status !== 'resolved' && incident.status !== 'archived'
    ).length,
    resolved: incidents.filter(
      incident => incident.status === 'resolved'
    ).length,
    critical: incidents.filter(
      incident => incident.priority === 'critical'
    ).length,
    high: incidents.filter(
      incident => incident.priority === 'high'
    ).length,
  }
}

test('calculateIncidentSummary returns correct analytics counts', () => {
  const incidents = [
    { status: 'triggered', priority: 'critical' },
    { status: 'acknowledged', priority: 'high' },
    { status: 'resolved', priority: 'medium' },
    { status: 'archived', priority: 'low' },
  ]

  const result = calculateIncidentSummary(incidents)

  assert.strictEqual(result.total, 4)
  assert.strictEqual(result.active, 2)
  assert.strictEqual(result.resolved, 1)
  assert.strictEqual(result.critical, 1)
  assert.strictEqual(result.high, 1)
})

test('calculateIncidentSummary handles empty incident list', () => {
  const result = calculateIncidentSummary([])

  assert.strictEqual(result.total, 0)
  assert.strictEqual(result.active, 0)
  assert.strictEqual(result.resolved, 0)
  assert.strictEqual(result.critical, 0)
  assert.strictEqual(result.high, 0)
})