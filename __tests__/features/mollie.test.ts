import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  invoicePeriodEnd,
  parseInvoiceTotal,
} from '../../features/billing/invoice';
import { isBillingPaymentUrl } from '../../features/billing/qonto';
import {
  buildPayment,
  euroCents,
  isMollieCheckoutUrl,
  matchesPayment,
  mollieRequest,
  paymentMetadata,
  type MolliePayment,
  type PaymentAttempt,
} from '../../supabase/functions/_shared/mollie';

const attempt: PaymentAttempt = {
  id: '11111111-1111-4111-8111-111111111111',
  request_id: '22222222-2222-4222-8222-222222222222',
  organization_id: '33333333-3333-4333-8333-333333333333',
  plan: 'essential',
  profile_id: 'pfl_fixture',
  mode: 'live',
  amount_cents: 29900,
  invoice_reference: 'INVOICE-TEST',
  paid_until: '2027-01-01T23:59:59Z',
  payment_id: 'tr_fixture123',
};
const payment = (): MolliePayment => ({
  id: attempt.payment_id!,
  profileId: attempt.profile_id,
  mode: 'live',
  status: 'paid',
  amount: { currency: 'EUR', value: '299.00' },
  paidAt: '2026-11-03T00:00:00Z',
  metadata: paymentMetadata(attempt),
});

describe('invoiced totals and periods', () => {
  it.each([
    ['299', 29900],
    ['299,50', 29950],
    ['299.5', 29950],
    ['0,50', 50],
    ['10000.00', 1000000],
  ])('parses %s exactly', (text, cents) => {
    expect(parseInvoiceTotal(String(text))).toBe(cents);
  });
  it.each([
    '-1',
    '0',
    '1e3',
    '1,234',
    '299.999',
    '10 000',
    '10000.01',
    '',
    '001.00',
  ])('rejects ambiguous or unsupported total %s', (input) => {
    expect(parseInvoiceTotal(input)).toBeNull();
  });
  it('rejects impossible dates instead of silently rolling the period forward', () => {
    expect(invoicePeriodEnd('2026-02-30')).toBeNull();
    expect(invoicePeriodEnd('2026-13-01')).toBeNull();
    expect(invoicePeriodEnd('2026-12-31')).toBe('2026-12-31T23:59:59.000Z');
  });
  it('requires exact provider decimal amounts', () => {
    expect(euroCents('299.00')).toBe(29900);
    for (const input of ['299,00', '299.999', '2.99e2', 299])
      expect(euroCents(input)).toBeNull();
  });
});

describe('payment integrity', () => {
  it('binds a provider payment to the exact quote, tenant, profile, plan, mode and invoice', () => {
    expect(matchesPayment(payment(), attempt)).toBe(true);
    const alternatives = [
      { id: 'tr_another123' },
      { mode: 'test' },
      { profileId: 'pfl_someone_else' },
      { amount: { currency: 'USD', value: '299.00' } },
      { amount: { currency: 'EUR', value: '2.99' } },
      {
        metadata: {
          ...paymentMetadata(attempt),
          organization_id: 'another-tenant',
        },
      },
      { metadata: { ...paymentMetadata(attempt), plan: 'business' } },
      {
        metadata: {
          ...paymentMetadata(attempt),
          invoice_reference: 'another-invoice',
        },
      },
      { metadata: {} },
    ];
    for (const changed of alternatives)
      expect(matchesPayment({ ...payment(), ...changed }, attempt)).toBe(false);
  });
  it('does not treat a return URL as a paid state or create a debit mandate', () => {
    const payload = buildPayment(
      attempt,
      'https://opspilot-mu-six.vercel.app/',
      'https://fixture.supabase.co',
    );
    expect(payload).toMatchObject({
      sequenceType: 'oneoff',
      amount: { value: '299.00', currency: 'EUR' },
      webhookUrl: 'https://fixture.supabase.co/functions/v1/mollie-webhook',
    });
    expect(payload.redirectUrl).not.toContain('paid=true');
    expect(payload).not.toHaveProperty('customerId');
    expect(payload).not.toHaveProperty('mandateId');
    expect(payload).not.toHaveProperty('profileId');
    expect(() =>
      buildPayment(attempt, 'https://evil.test', 'https://fixture.supabase.co'),
    ).toThrow();
  });
  it('accepts only hosted payment paths on exact trusted domains', () => {
    const valid = 'https://www.mollie.com/checkout/select-method/fixture';
    expect(isMollieCheckoutUrl(valid)).toBe(true);
    expect(
      isBillingPaymentUrl({
        payment_url: valid,
        payment_provider: 'mollie',
        mollie_payment_id: 'tr_fixture123',
      }),
    ).toBe(true);
    expect(
      isBillingPaymentUrl({ payment_url: valid, payment_provider: 'qonto' }),
    ).toBe(false);
    expect(
      isBillingPaymentUrl({ payment_url: valid, payment_provider: 'mollie' }),
    ).toBe(false);
    for (const url of [
      'https://www.mollie.com.evil.test/checkout/a',
      'http://www.mollie.com/checkout/a',
      'https://user@www.mollie.com/checkout/a',
      'https://www.mollie.com/login',
      'https://checkout.mollie.com/',
    ]) {
      expect(isMollieCheckoutUrl(url)).toBe(false);
      expect(
        isBillingPaymentUrl({
          payment_url: url,
          payment_provider: 'mollie',
          mollie_payment_id: 'tr_fixture123',
        }),
      ).toBe(false);
    }
  });
});

describe('Mollie transport', () => {
  afterEach(() => vi.unstubAllGlobals());
  const config = {
    api_key: 'unit-credential',
    profile_id: 'pfl_fixture',
    app_url: 'https://opspilot-mu-six.vercel.app',
    mode: 'live' as const,
    enabled: true,
  };
  it('uses a stable idempotency key and refuses redirects', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'tr_fixture123' }),
    });
    vi.stubGlobal('fetch', fetcher);
    await mollieRequest(
      config,
      'payments',
      { amount: { value: '299.00' } },
      attempt.id,
    );
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.mollie.com/v2/payments',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: expect.objectContaining({ 'Idempotency-Key': attempt.id }),
      }),
    );
  });
  it('does not echo provider responses or credentials in errors', async () => {
    const providerBody = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: providerBody }),
    );
    await expect(mollieRequest(config, 'payments')).rejects.toThrow(
      'provider_http_403',
    );
    expect(providerBody).not.toHaveBeenCalled();
  });
});
