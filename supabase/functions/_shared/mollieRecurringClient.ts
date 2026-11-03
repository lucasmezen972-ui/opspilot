import { Client, HTTPClient } from 'npm:mollie-api-typescript@1.12.44';
import type {
  EntityCustomer,
  PaymentRequest,
  SubscriptionRequest,
} from 'npm:mollie-api-typescript@1.12.44/models';

import type { MollieConfig } from './mollie.ts';

/** SDK transport: fixed provider, bounded requests, no automatic write retries. */
function client(cfg: MollieConfig) {
  const apiKey = /^(test|live)_/.test(cfg.api_key);
  if (apiKey && !cfg.api_key.startsWith(`${cfg.mode}_`))
    throw new Error('credential_mode_mismatch');
  return new Client({
    security: apiKey
      ? { apiKey: cfg.api_key }
      : { advancedAccessToken: cfg.api_key },
    ...(apiKey
      ? {}
      : { profileId: cfg.profile_id, testmode: cfg.mode === 'test' }),
    timeoutMs: 8000,
    retryConfig: { strategy: 'none' },
    debugLogger: { group() {}, groupEnd() {}, log() {} },
    httpClient: new HTTPClient({
      fetcher: (input, init) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
        );
        if (url.origin !== 'https://api.mollie.com')
          throw new Error('invalid_provider_origin');
        return fetch(input, { ...init, redirect: 'error' });
      },
    }),
  });
}

// The official SDK calls REST's _links/_embedded fields links/embedded.
function restShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(restShape);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => typeof v !== 'function')
        .map(([k, v]) => [
          k === 'links' ? '_links' : k === 'embedded' ? '_embedded' : k,
          restShape(v),
        ]),
    );
  return value;
}

export async function sepaRequest<T>(
  cfg: MollieConfig,
  path: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string,
  method = body ? 'POST' : 'GET',
): Promise<T> {
  const sdk = client(cfg);
  const parts = path.split('/');
  let result: unknown;
  try {
    if (path === 'customers' && method === 'POST' && body) {
      result = await sdk.customers.create({
        entityCustomer: body as EntityCustomer,
        idempotencyKey,
      });
    } else if (path === 'payments' && method === 'POST' && body) {
      result = await sdk.payments.create({
        paymentRequest: body as PaymentRequest,
        idempotencyKey,
      });
    } else if (/^payments\/tr_[A-Za-z0-9]+$/.test(path) && method === 'GET') {
      result = await sdk.payments.get({ paymentId: parts[1]! });
    } else if (
      /^methods\?sequenceType=(first|recurring)$/.test(path) &&
      method === 'GET'
    ) {
      result = await sdk.methods.list({
        sequenceType: path.endsWith('first') ? 'first' : 'recurring',
      });
    } else if (
      /^customers\/cst_[A-Za-z0-9]+\/mandates$/.test(path) &&
      method === 'GET'
    ) {
      const page = await sdk.mandates.list({
        customerId: parts[1]!,
        limit: 250,
      });
      if (page.result.links.next) throw new Error('provider_pagination_review');
      result = page.result;
    } else if (/^customers\/cst_[A-Za-z0-9]+\/subscriptions$/.test(path)) {
      if (method === 'POST' && body) {
        result = await sdk.subscriptions.create({
          customerId: parts[1]!,
          subscriptionRequest: body as SubscriptionRequest,
          idempotencyKey,
        });
      } else if (method === 'GET') {
        const page = await sdk.subscriptions.list({
          customerId: parts[1]!,
          limit: 250,
        });
        if (page.result.links.next)
          throw new Error('provider_pagination_review');
        result = page.result;
      } else throw new Error('invalid_provider_method');
    } else if (
      /^customers\/cst_[A-Za-z0-9]+\/subscriptions\/sub_[A-Za-z0-9]+\/payments$/.test(
        path,
      ) &&
      method === 'GET'
    ) {
      const page = await sdk.subscriptions.listPayments({
        customerId: parts[1]!,
        subscriptionId: parts[3]!,
        limit: 10,
      });
      result = page.result;
    } else if (
      /^customers\/cst_[A-Za-z0-9]+\/subscriptions\/sub_[A-Za-z0-9]+$/.test(
        path,
      )
    ) {
      const request = { customerId: parts[1]!, subscriptionId: parts[3]! };
      if (method === 'GET') result = await sdk.subscriptions.get(request);
      else if (method === 'DELETE')
        result = await sdk.subscriptions.cancel({
          ...request,
          ...(/^(test|live)_/.test(cfg.api_key)
            ? {}
            : { requestBody: { testmode: cfg.mode === 'test' } }),
        });
      else throw new Error('invalid_provider_method');
    } else throw new Error('invalid_provider_path');
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'statusCode' in error)
      throw new Error(`provider_http_${Number(error.statusCode)}`);
    // Never return a provider error containing request headers, keys or bank details.
    throw new Error('provider_request_failed');
  }
  return restShape(result ?? {}) as T;
}
