const { sanitizeForDb } = require('../dist/utils/dbUtils.js');

const value = sanitizeForDb('café ☕');
if (value !== 'café ☕') {
  throw new Error(`Unexpected sanitized value: ${value}`);
}

console.log('dbUtils sanitizeForDb verified');
