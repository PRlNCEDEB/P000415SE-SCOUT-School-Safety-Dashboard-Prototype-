const test = require('node:test')
const assert = require('node:assert/strict')

function validateIncidentPayload(payload = {}) {
  const errors = []

  if (!payload.title || payload.title.trim() === '') {
    errors.push('Title is required')
  }

  if (!payload.type || payload.type.trim() === '') {
    errors.push('Incident type is required')
  }

  if (!payload.location || payload.location.trim() === '') {
    errors.push('Location is required')
  }

  const allowedPriorities = ['low', 'medium', 'high', 'critical']

  if (payload.priority && !allowedPriorities.includes(payload.priority)) {
    errors.push('Invalid priority')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

test('valid incident payload passes validation', () => {
  const payload = {
    title: 'Fire Alert',
    type: 'fire',
    location: 'Science Block',
    priority: 'high',
  }

  const result = validateIncidentPayload(payload)

  assert.equal(result.isValid, true)
  assert.deepEqual(result.errors, [])
})

test('missing title fails validation', () => {
  const payload = {
    type: 'fire',
    location: 'Science Block',
    priority: 'high',
  }

  const result = validateIncidentPayload(payload)

  assert.equal(result.isValid, false)
  assert.ok(result.errors.includes('Title is required'))
})

test('missing location fails validation', () => {
  const payload = {
    title: 'Fire Alert',
    type: 'fire',
    priority: 'high',
  }

  const result = validateIncidentPayload(payload)

  assert.equal(result.isValid, false)
  assert.ok(result.errors.includes('Location is required'))
})

test('invalid priority fails validation', () => {
  const payload = {
    title: 'Fire Alert',
    type: 'fire',
    location: 'Science Block',
    priority: 'urgent',
  }

  const result = validateIncidentPayload(payload)

  assert.equal(result.isValid, false)
  assert.ok(result.errors.includes('Invalid priority'))
})