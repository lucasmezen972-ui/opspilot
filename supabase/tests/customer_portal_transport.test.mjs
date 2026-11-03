import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deliverCustomerPortalEvent,
  CUSTOMER_PORTAL_URL,
} from '../functions/_shared/customerPortalTransport.ts';

const secret = 'test-only-customer-sync-key-1234567890',
  payload = {
    version: 1,
    eventId: 'opspilot:1',
    revision: 1,
    accountId: 'fixture',
    company: {
      name: 'Fixture',
      contactName: 'Contact',
      email: 'fixture@example.test',
    },
    service: {
      product: 'opspilot',
      plan: 'essential',
      state: 'active',
      amount_cents: null,
      interval: 'none',
      period_end: null,
      invoice_reference: '',
    },
  };
test('delivery signs the exact body and uses only the pinned portal endpoint', async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.equal(url, CUSTOMER_PORTAL_URL);
    assert.equal(options?.redirect, 'error');
    const headers = new Headers(options?.headers);
    assert.equal(headers.has('Authorization'), false);
    assert.equal(headers.has('Origin'), false);
    assert.equal(headers.get('x-tradikom-timestamp'), '1800000000000');
    const signature = headers.get('x-tradikom-signature');
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    assert.equal(
      await crypto.subtle.verify(
        'HMAC',
        key,
        Uint8Array.from(signature.slice(3).match(/../g), (value) =>
          parseInt(value, 16),
        ),
        new TextEncoder().encode('1800000000000.' + String(options?.body)),
      ),
      true,
    );
    assert.deepEqual(JSON.parse(String(options?.body)), payload);
    return Response.json({ received: true });
  };
  assert.deepEqual(
    await deliverCustomerPortalEvent(payload, secret, fetcher, 1800000000000),
    { state: 'sent', code: '' },
  );
  assert.equal(calls, 1);
});
test('HTTP success alone is insufficient and receipts are bounded', async () => {
  for (const response of [
    Response.json({ ok: true }),
    new Response('bad json'),
    new Response('x'.repeat(5000)),
  ]) {
    const result = await deliverCustomerPortalEvent(
      payload,
      secret,
      async () => response,
    );
    assert.equal(result.state, 'retry');
  }
});
test('temporary errors retry while rejected associations require review', async () => {
  for (const status of [429, 500, 503])
    assert.equal(
      (
        await deliverCustomerPortalEvent(
          payload,
          secret,
          async () => new Response('', { status }),
        )
      ).state,
      'retry',
    );
  for (const status of [400, 401, 403, 409])
    assert.equal(
      (
        await deliverCustomerPortalEvent(
          payload,
          secret,
          async () => new Response('', { status }),
        )
      ).state,
      'review',
    );
});
test('network errors expose no credential, payload or upstream response', async () => {
  const result = await deliverCustomerPortalEvent(payload, secret, async () => {
    throw new Error(secret + ' ' + JSON.stringify(payload));
  });
  assert.deepEqual(result, { state: 'retry', code: 'portal_unavailable' });
});
test('missing credentials and oversized events do not make a network request', async () => {
  const forbidden = async () => {
    throw new Error('must not fetch');
  };
  assert.equal(
    (await deliverCustomerPortalEvent(payload, '', forbidden)).state,
    'review',
  );
  assert.equal(
    (
      await deliverCustomerPortalEvent(
        { text: 'x'.repeat(17000) },
        secret,
        forbidden,
      )
    ).code,
    'event_too_large',
  );
});
test('retries retain the same event body and revision with a fresh transport signature', async () => {
  const bodies = [],
    signatures = [];
  const fetcher = async (_url, options) => {
    bodies.push(String(options?.body));
    signatures.push(new Headers(options?.headers).get('x-tradikom-signature'));
    return Response.json({ received: true, duplicate: bodies.length > 1 });
  };
  await deliverCustomerPortalEvent(payload, secret, fetcher, 1800000000000);
  await deliverCustomerPortalEvent(payload, secret, fetcher, 1800000001000);
  assert.equal(bodies[0], bodies[1]);
  assert.notEqual(signatures[0], signatures[1]);
});
