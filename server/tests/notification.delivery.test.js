const test = require('node:test')
const assert = require('node:assert/strict')

function processNotification(recipient = {}) {
  const result = {
    emailStatus: 'pending',
    smsStatus: 'pending',
  }

  if (recipient.email) {
    result.emailStatus = 'sent'
  } else {
    result.emailStatus = 'failed'
  }

  if (recipient.phone) {
    result.smsStatus = 'sent'
  } else {
    result.smsStatus = 'skipped'
  }

  return result
}

test('notification succeeds when email and phone exist', () => {
  const recipient = {
    email: 'staff@school.edu',
    phone: '+61400000000',
  }

  const result = processNotification(recipient)

  assert.equal(result.emailStatus, 'sent')
  assert.equal(result.smsStatus, 'sent')
})

test('email fails when email is missing', () => {
  const recipient = {
    phone: '+61400000000',
  }

  const result = processNotification(recipient)

  assert.equal(result.emailStatus, 'failed')
  assert.equal(result.smsStatus, 'sent')
})

test('sms is skipped when phone is missing', () => {
  const recipient = {
    email: 'staff@school.edu',
  }

  const result = processNotification(recipient)

  assert.equal(result.emailStatus, 'sent')
  assert.equal(result.smsStatus, 'skipped')
})