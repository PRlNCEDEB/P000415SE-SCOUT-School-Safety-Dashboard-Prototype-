const test = require('node:test')
const assert = require('node:assert/strict')

function calculateSummary(incidents = []) {
  const totalIncidents = incidents.length

  const resolvedCount = incidents.filter(
    incident => incident.status === 'resolved'
  ).length

  return {
    totalIncidents,
    resolvedCount,
  }
}

function countIncidentsByType(incidents = []) {
  return incidents.reduce((acc, incident) => {
    const type = incident.type || 'general'

    acc[type] = (acc[type] || 0) + 1

    return acc
  }, {})
}

test('calculateSummary returns total and resolved incidents', () => {
  const incidents = [
    { id: '1', status: 'resolved' },
    { id: '2', status: 'active' },
    { id: '3', status: 'resolved' },
  ]

  const result = calculateSummary(incidents)

  assert.equal(result.totalIncidents, 3)
  assert.equal(result.resolvedCount, 2)
})

test('countIncidentsByType groups incidents by type', () => {
  const incidents = [
    { id: '1', type: 'fire' },
    { id: '2', type: 'medical' },
    { id: '3', type: 'fire' },
    { id: '4' },
  ]

  const result = countIncidentsByType(incidents)

  assert.equal(result.fire, 2)
  assert.equal(result.medical, 1)
  assert.equal(result.general, 1)
})