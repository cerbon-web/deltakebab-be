import test from 'node:test';
import { strict as assert } from 'node:assert';
import { buildDeviceRegistrationFingerprint, getNotificationTitleForOrder } from './firebaseService';

test('buildDeviceRegistrationFingerprint produces a stable sha256-ish value', () => {
  const a = buildDeviceRegistrationFingerprint('token-123');
  const b = buildDeviceRegistrationFingerprint('token-123');
  const c = buildDeviceRegistrationFingerprint('token-456');

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^sha256:/);
});

test('getNotificationTitleForOrder keeps order context readable', () => {
  const title = getNotificationTitleForOrder({ orderNumber: 'A-104', branchName: 'Gdańsk Wrzeszcz' });
  assert.equal(title, 'Nowe zamówienie #A-104 • Gdańsk Wrzeszcz');
});
