const test = require('node:test')
const assert = require('node:assert/strict')

function toNotificationResponse(notification = {}) {
  return {
    id: notification.id || '',
    incidentTitle: notification.incidentTitle || 'Unknown incident',
    recipientName: notification.recipientName || 'Unknown recipient',
    recipientEmail: notification.recipientEmail || '',
    sms: notification.smsStatus || 'pending',
    email: notification.emailStatus || 'pending',
    type: notification.incidentType || 'general',
  }
}

test('toNotificationResponse applies default values', () => {
  const result = toNotificationResponse({})

  assert.equal(result.incidentTitle, 'Unknown incident')
  assert.equal(result.recipientName, 'Unknown recipient')
  assert.equal(result.sms, 'pending')
})

test('toNotificationResponse preserves provided values', () => {
  const result = toNotificationResponse({
    id: '1',
    incidentTitle: 'Fire Alert',
    recipientName: 'John',
    recipientEmail: 'john@test.com',
    smsStatus: 'sent',
    emailStatus: 'sent',
    incidentType: 'fire',
  })

  assert.equal(result.id, '1')
  assert.equal(result.incidentTitle, 'Fire Alert')
  assert.equal(result.recipientName, 'John')
  assert.equal(result.sms, 'sent')
  assert.equal(result.email, 'sent')
})