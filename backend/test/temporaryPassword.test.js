const test = require('node:test');
const assert = require('node:assert/strict');

const { getTemporaryPassword } = require('../src/utils/temporaryPassword');

test('every administratively created user receives the same temporary password', () => {
  assert.equal(getTemporaryPassword(), 'Admin@1234');
  assert.equal(getTemporaryPassword(), getTemporaryPassword());
});
