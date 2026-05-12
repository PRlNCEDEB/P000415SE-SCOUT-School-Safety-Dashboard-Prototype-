const test = require('node:test')
const assert = require('node:assert/strict')

function healthResponse() {
  return {
    status: 'ok',
    message: 'SCOUT API is running',
  }
}

test('healthResponse returns API status', () => {
  const result = healthResponse()

  assert.equal(result.status, 'ok')
  assert.equal(result.message, 'SCOUT API is running')
})