const test = require('node:test')
const assert = require('node:assert')

function toNotificationResponse(item = {}) {
  return {
    id: item.id,
    incidentId: item.incidentId || '',
    incidentTitle: item.incidentTitle || 'Unknown incident',
    recipientName: item.recipientName || 'Unknown recipient',
    recipientEmail: item.recipientEmail || '',
    recipientPhone: item.recipientPhone || '',
    sms: item.smsStatus || 'pending',
    email: item.emailStatus || 'pending',
    type: item.incidentType || 'general',
    timestamp: item.createdAt || '',
  }
}

test('toNotificationResponse applies defaults for missing fields', () => {
  const result = toNotificationResponse({ id: 'n1' })

  assert.strictEqual(result.id, 'n1')
  assert.strictEqual(result.incidentTitle, 'Unknown incident')
  assert.strictEqual(result.recipientName, 'Unknown recipient')
  assert.strictEqual(result.sms, 'pending')
  assert.strictEqual(result.email, 'pending')
  assert.strictEqual(result.type, 'general')
})

test('toNotificationResponse preserves provided notification values', () => {
  const result = toNotificationResponse({
    id: 'n2',
    incidentId: 'inc1',
    incidentTitle: 'Fire alert',
    recipientName: 'John Staff',
    recipientEmail: 'john@school.edu',
    recipientPhone: '+61400000000',
    smsStatus: 'sent',
    emailStatus: 'failed',
    incidentType: 'fire',
    createdAt: '2026-05-07T10:00:00.000Z',
  })

  assert.strictEqual(result.incidentId, 'inc1')
  assert.strictEqual(result.incidentTitle, 'Fire alert')
  assert.strictEqual(result.recipientName, 'John Staff')
  assert.strictEqual(result.sms, 'sent')
  assert.strictEqual(result.email, 'failed')
  assert.strictEqual(result.type, 'fire')
})