import test from 'node:test';
import assert from 'node:assert/strict';
import { buildErrorResponse, mapZodErrorToPayload } from './errorResponse';
import { z } from 'zod';

test('buildErrorResponse creates a stable payload for validation errors', () => {
  const payload = buildErrorResponse({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: [{ field: 'guestPhone', code: 'PHONE_TOO_SHORT' }]
  });

  assert.deepEqual(payload, {
    status: 'error',
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: [{ field: 'guestPhone', code: 'PHONE_TOO_SHORT' }]
  });
});

test('mapZodErrorToPayload maps a short phone to a stable field code', () => {
  const schema = z.object({ guestPhone: z.string().min(5) });
  const result = mapZodErrorToPayload(schema.safeParse({ guestPhone: '123' }).error!);

  assert.equal(result.code, 'VALIDATION_ERROR');
  assert.equal(result.errors[0]?.field, 'guestPhone');
  assert.equal(result.errors[0]?.code, 'PHONE_TOO_SHORT');
});
