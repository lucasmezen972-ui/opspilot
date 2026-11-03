import {
  buildFirstSepaPayment,
  buildSepaSubscription,
  selectSepaFirstMethod,
  sepaPaymentBelongs,
  type SepaAgreement,
  type SepaPayment,
} from './sepa.ts';

const assert = (value: unknown, label: string) => {
  if (!value) throw new Error(label);
};
// Domain tests remain runnable when the external SDK registry is unavailable.
const sdkPath = './mollieRecurringClient.ts';
const agreement: SepaAgreement = {
  id: '10000000-0000-4000-a000-000000000001',
  organization_id: '20000000-0000-4000-a000-000000000001',
  request_id: '30000000-0000-4000-a000-000000000001',
  created_by: '40000000-0000-4000-a000-000000000001',
  profile_id: 'pfl_fixture',
  mode: 'test',
  plan: 'essential',
  amount_cents: 19900,
  invoice_reference: 'TEST-ONLY',
  first_paid_until: '2026-12-02T23:59:59Z',
  next_charge_date: '2026-12-03',
  interval_months: 1,
  status: 'mandate_pending',
  consented_at: '2026-11-03T00:00:00Z',
  customer_id: 'cst_fixture',
  first_payment_id: 'tr_firstfixture',
  checkout_url: null,
  mandate_id: 'mdt_fixture',
  provider_subscription_id: 'sub_fixture',
  creation_started_at: null,
  subscription_started_at: null,
};
const payment: SepaPayment = {
  id: 'tr_firstfixture',
  profileId: 'pfl_fixture',
  mode: 'test',
  customerId: 'cst_fixture',
  sequenceType: 'first',
  method: 'paybybank',
  amount: { currency: 'EUR', value: '199.00' },
  status: 'paid',
  metadata: { purpose: 'opspilot_sepa_v1', agreement_id: agreement.id },
};

Deno.test(
  'first checkout binds the exact Qonto total and a bank-created mandate',
  () => {
    const body = buildFirstSepaPayment(
      agreement,
      'https://project.supabase.co',
      'paybybank',
    );
    assert(
      body.amount.value === '199.00' &&
        body.method === 'paybybank' &&
        body.sequenceType === 'first',
      'wrong first payment',
    );
    assert(!('consumerAccount' in body), 'IBAN must stay with provider');
  },
);
Deno.test(
  'first SEPA checkout selects only an available bank mandate method',
  () => {
    assert(
      selectSepaFirstMethod([{ id: 'ideal' }, { id: 'paybybank' }]) ===
        'paybybank',
      'Pay by Bank must be preferred when offered',
    );
    const method = selectSepaFirstMethod([
      { id: 'creditcard' },
      { id: 'ideal' },
    ]);
    assert(method === 'ideal', 'available iDEAL fallback rejected');
    const body = buildFirstSepaPayment(
      agreement,
      'https://project.supabase.co',
      method!,
    );
    assert(
      body.method === 'ideal' && body.sequenceType === 'first',
      'fallback was not bound to the first payment',
    );
    for (const methods of [[], [{ id: 'creditcard' }], [{ id: 'paypal' }]])
      assert(
        selectSepaFirstMethod(methods) === null,
        'non-bank mandate method accepted',
      );
    let rejected = false;
    try {
      buildFirstSepaPayment(
        agreement,
        'https://project.supabase.co',
        // @ts-expect-error Verify the runtime guard against untyped input too.
        'creditcard',
      );
    } catch {
      rejected = true;
    }
    assert(rejected, 'untyped card input created a SEPA checkout');
  },
);
Deno.test(
  'provider payments require profile, mode, customer, amount and agreement binding',
  () => {
    assert(
      sepaPaymentBelongs(payment, agreement),
      'valid first payment rejected',
    );
    assert(
      sepaPaymentBelongs({ ...payment, method: 'ideal' }, agreement),
      'valid iDEAL first payment rejected',
    );
    for (const bad of [
      { mode: 'live' },
      { profileId: 'pfl_other' },
      { customerId: 'cst_other' },
      { amount: { currency: 'EUR', value: '1.00' } },
      { metadata: { agreement_id: 'other', purpose: 'opspilot_sepa_v1' } },
      { sequenceType: 'oneoff' },
      { method: 'creditcard' },
      { method: 'paypal' },
    ])
      assert(
        !sepaPaymentBelongs({ ...payment, ...bad }, agreement),
        'mismatch accepted',
      );
    const recurring = {
      ...payment,
      id: 'tr_nextfixture',
      subscriptionId: 'sub_fixture',
      sequenceType: 'recurring',
      method: 'directdebit',
    };
    assert(
      sepaPaymentBelongs(recurring, agreement),
      'valid recurring payment rejected',
    );
    assert(
      !sepaPaymentBelongs(
        { ...recurring, subscriptionId: 'sub_other' },
        agreement,
      ),
      'foreign subscription accepted',
    );
    assert(
      !sepaPaymentBelongs({ ...recurring, method: 'creditcard' }, agreement),
      'wrong mandate type accepted',
    );
  },
);
Deno.test(
  'subscription requires a recorded consent, valid mandate and fourteen days notice',
  () => {
    const now = new Date('2026-11-03T00:00:00Z');
    const body = buildSepaSubscription(
      agreement,
      'mdt_fixture',
      'https://project.supabase.co',
      now,
    );
    assert(
      body.startDate === '2026-12-03' &&
        body.method === 'directdebit' &&
        body.interval === '1 month',
      'wrong schedule',
    );
    for (const bad of [
      { consented_at: null },
      { consented_at: 'invalid' },
      { next_charge_date: '2026-11-04' },
      { next_charge_date: '2026-10-03' },
    ]) {
      let rejected = false;
      try {
        buildSepaSubscription(
          { ...agreement, ...bad },
          'mdt_fixture',
          'https://project.supabase.co',
          now,
        );
      } catch {
        rejected = true;
      }
      assert(rejected, 'unsafe schedule accepted');
    }
  },
);
Deno.test(
  'SDK sends test mode/profile/idempotence and never retries a provider failure',
  async () => {
    const { sepaRequest } = await import(sdkPath);
    const original = globalThis.fetch;
    const requests: Request[] = [];
    globalThis.fetch = async (input, init) => {
      requests.push(
        input instanceof Request ? input.clone() : new Request(input, init),
      );
      return new Response(
        JSON.stringify({
          status: 503,
          title: 'Unavailable',
          detail: 'Fixture',
        }),
        { status: 503, headers: { 'Content-Type': 'application/hal+json' } },
      );
    };
    try {
      const cfg = {
        api_key: 'access_fixture',
        profile_id: 'pfl_fixture',
        app_url: 'https://example.invalid',
        mode: 'test' as const,
        enabled: true,
      };
      let rejected = false;
      try {
        await sepaRequest(
          cfg,
          `customers/${agreement.customer_id}/subscriptions`,
          buildSepaSubscription(
            agreement,
            'mdt_fixture',
            'https://project.supabase.co',
            new Date('2026-11-03T00:00:00Z'),
          ),
          agreement.id,
        );
      } catch {
        rejected = true;
      }
      assert(
        rejected && requests.length === 1,
        'unsafe retry or unexpected success',
      );
      const body = await requests[0]!.json();
      assert(
        body.testmode === true && body.profileId === 'pfl_fixture',
        'SDK omitted explicit mode/profile',
      );
      assert(
        requests[0]!.headers.get('idempotency-key') === agreement.id,
        'missing stable idempotency',
      );
      assert(
        requests[0]!.url ===
          'https://api.mollie.com/v2/customers/cst_fixture/subscriptions',
        'wrong provider endpoint',
      );
    } finally {
      globalThis.fetch = original;
    }
  },
);
Deno.test(
  'SDK refuses provider paths outside the implemented lifecycle',
  async () => {
    const { sepaRequest } = await import(sdkPath);
    let rejected = false;
    try {
      await sepaRequest(
        {
          api_key: 'test_fixture',
          profile_id: 'pfl_fixture',
          app_url: 'https://example.invalid',
          mode: 'test',
          enabled: true,
        },
        'https://attacker.invalid/payments',
      );
    } catch {
      rejected = true;
    }
    assert(rejected, 'unexpected provider path accepted');
  },
);

Deno.test(
  'test configuration refuses live API credentials before any request',
  async () => {
    const { sepaRequest } = await import(sdkPath);
    let rejected = false;
    try {
      await sepaRequest(
        {
          api_key: 'live_fixture',
          profile_id: 'pfl_fixture',
          app_url: 'https://example.invalid',
          mode: 'test',
          enabled: true,
        },
        'customers',
        { name: 'Fixture' },
      );
    } catch (error) {
      rejected =
        error instanceof Error && error.message === 'credential_mode_mismatch';
    }
    assert(rejected, 'live credential accepted in a test flow');
  },
);

Deno.test(
  'SDK keeps customer, checkout, lookup and cancellation in explicit test mode',
  async () => {
    const { sepaRequest } = await import(sdkPath);
    const original = globalThis.fetch,
      requests: Request[] = [];
    globalThis.fetch = async (input, init) => {
      requests.push(
        input instanceof Request ? input.clone() : new Request(input, init),
      );
      return new Response(
        JSON.stringify({
          status: 503,
          title: 'Unavailable',
          detail: 'Fixture',
        }),
        { status: 503, headers: { 'Content-Type': 'application/hal+json' } },
      );
    };
    const cfg = {
      api_key: 'access_fixture',
      profile_id: 'pfl_fixture',
      app_url: 'https://example.invalid',
      mode: 'test' as const,
      enabled: true,
    };
    try {
      for (const [path, body, method] of [
        [
          'customers',
          { name: 'Fixture', email: 'fixture@example.invalid' },
          'POST',
        ],
        [
          'payments',
          buildFirstSepaPayment(
            agreement,
            'https://project.supabase.co',
            'ideal',
          ),
          'POST',
        ],
        ['payments/tr_firstfixture', undefined, 'GET'],
        [
          'customers/cst_fixture/subscriptions/sub_fixture',
          undefined,
          'DELETE',
        ],
      ] as const) {
        const before = requests.length;
        try {
          await sepaRequest(cfg, path, body, agreement.id, method);
        } catch {
          /* Expected mocked provider failure. */
        }
        assert(
          requests.length === before + 1,
          'SDK did not reach the expected test request',
        );
        const request = requests.at(-1)!;
        if (method === 'GET')
          assert(
            new URL(request.url).searchParams.get('testmode') === 'true',
            'lookup omitted test mode',
          );
        else
          assert(
            (await request.json()).testmode === true,
            'mutation omitted test mode',
          );
      }
    } finally {
      globalThis.fetch = original;
    }
  },
);
