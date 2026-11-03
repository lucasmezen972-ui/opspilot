import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readCustomerPortalWorkerToken,
  sameCustomerPortalWorkerToken,
} from '../functions/_shared/customerPortalWorkerAuth.ts';

const token = 'test-only-worker-token-' + 'a'.repeat(42);
test('the deployed scalar token and legacy object token authenticate identically', async () => {
  for (const stored of [token, { token }]) {
    const expected = readCustomerPortalWorkerToken(stored);
    assert.equal(await sameCustomerPortalWorkerToken(token, expected), true);
    assert.equal(
      await sameCustomerPortalWorkerToken(token + 'x', expected),
      false,
    );
  }
});
test('missing, short, malformed and unbounded stored values cannot authenticate', async () => {
  for (const stored of [
    undefined,
    null,
    true,
    42,
    {},
    { token: null },
    { token: 12 },
    [],
    '',
    'short',
    'x'.repeat(257),
  ]) {
    const expected = readCustomerPortalWorkerToken(stored);
    assert.equal(expected, '');
    assert.equal(await sameCustomerPortalWorkerToken(token, expected), false);
  }
  assert.equal(await sameCustomerPortalWorkerToken('', token), false);
  assert.equal(
    await sameCustomerPortalWorkerToken('x'.repeat(257), token),
    false,
  );
});
