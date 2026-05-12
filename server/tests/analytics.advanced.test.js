const test = require('node:test')
const assert = require('node:assert/strict')

function calculateAverageResponseTime(incidents = []) {
  const resolvedIncidents = incidents.filter(
    incident => typeof incident.responseTime === 'number'
  )

  if (resolvedIncidents.length === 0) {
    return 0
  }

  const totalResponseTime = resolvedIncidents.reduce(
    (sum, incident) => sum + incident.responseTime,
    0
  )

  return Math.round(totalResponseTime / resolvedIncidents.length)
}

function countIncidentsByLocation(incidents = []) {
  return incidents.reduce((acc, incident) => {
    const location = incident.location || 'Unknown location'
    acc[location] = (acc[location] || 0) + 1
    return acc
  }, {})
}

test('calculateAverageResponseTime returns average response time', () => {
  const incidents = [
    { id: '1', responseTime: 5 },
    { id: '2', responseTime: 10 },
    { id: '3', responseTime: 15 },
  ]

  const result = calculateAverageResponseTime(incidents)

  assert.equal(result, 10)
})

test('calculateAverageResponseTime returns 0 when no response time exists', () => {
  const incidents = [
    { id: '1' },
    { id: '2' },
  ]

  const result = calculateAverageResponseTime(incidents)

  assert.equal(result, 0)
})

test('countIncidentsByLocation groups incidents by location', () => {
  const incidents = [
    { id: '1', location: 'Library' },
    { id: '2', location: 'Oval' },
    { id: '3', location: 'Library' },
    { id: '4' },
  ]

  const result = countIncidentsByLocation(incidents)

  assert.equal(result.Library, 2)
  assert.equal(result.Oval, 1)
  assert.equal(result['Unknown location'], 1)
})