const test = require('node:test')
const assert = require('node:assert')

function toActionLogResponse(log = {}) {
  return {
    id: log.id || '',
    incidentId: log.incidentId || '',
    action: log.action || 'unknown',
    performedBy: log.performedBy || 'system',
    timestamp: log.timestamp || '',
  }
}

test('toActionLogResponse applies default values', () => {
  const result = toActionLogResponse({})

  assert.strictEqual(result.action, 'unknown')
  assert.strictEqual(result.performedBy, 'system')
})

test('toActionLogResponse preserves provided values', () => {
  const result = toActionLogResponse({
    id: 'log1',
    incidentId: 'inc1',
    action: 'acknowledged',
    performedBy: 'Admin User',
    timestamp: '2026-05-07T10:00:00.000Z',
  })

  assert.strictEqual(result.id, 'log1')
  assert.strictEqual(result.incidentId, 'inc1')
  assert.strictEqual(result.action, 'acknowledged')
  assert.strictEqual(result.performedBy, 'Admin User')
})