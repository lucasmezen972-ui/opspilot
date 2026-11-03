import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  onboarding: vi.fn(),
  request: vi.fn(),
}));
vi.mock('../../supabase/functions/_shared/billingAuth.ts', () => ({
  billingAdmin: {},
  SUPABASE_URL: 'https://fixture.supabase.co',
}));
vi.mock('../../supabase/functions/_shared/mollieRecurringClient.ts', () => ({
  sepaRequest: fixture.request,
}));
vi.mock('../../supabase/functions/_shared/mollie.ts', () => ({
  mollieRequest: fixture.onboarding,
}));

const cfg = {
  api_key: 'access_fixture',
  status_api_key: 'status_fixture',
  profile_id: 'pfl_fixture',
  app_url: 'https://example.invalid',
  mode: 'test' as 'test' | 'live',
  enabled: true,
};
// Keep the Deno dependency graph out of the application TypeScript project.
// Vitest still loads the real lifecycle with its external transports mocked.
const lifecyclePath = '../../supabase/functions/_shared/sepaLifecycle.ts';
const { recurringFirstMethod, recurringReady } = (await import(
  lifecyclePath
)) as {
  recurringFirstMethod: (config: typeof cfg) => Promise<string | null>;
  recurringReady: (config: typeof cfg) => Promise<boolean>;
};

function methods(first: string[], recurring = ['directdebit']) {
  fixture.request.mockImplementation(async (_config, path) => ({
    _embedded: {
      methods: (path.endsWith('first') ? first : recurring).map((id) => ({
        id,
      })),
    },
  }));
}

describe('disponibilité des mandats SEPA côté serveur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.onboarding.mockResolvedValue({
      canReceivePayments: true,
      canReceiveSettlements: true,
    });
  });

  it('utilise iDEAL quand le profil de test ne propose pas Pay by Bank', async () => {
    methods(['creditcard', 'ideal']);
    expect(await recurringFirstMethod(cfg)).toBe('ideal');
    expect(await recurringReady(cfg)).toBe(true);
    expect(fixture.request).toHaveBeenCalledWith(
      cfg,
      'methods?sequenceType=first',
    );
  });

  it('préfère Pay by Bank même si iDEAL est présenté en premier', async () => {
    methods(['ideal', 'creditcard', 'paybybank']);
    expect(await recurringFirstMethod(cfg)).toBe('paybybank');
  });

  it('refuse carte et PayPal qui ne créent pas de mandat SEPA', async () => {
    methods(['creditcard', 'paypal']);
    expect(await recurringFirstMethod(cfg)).toBeNull();
    expect(await recurringReady(cfg)).toBe(false);
  });

  it('refuse le parcours si directdebit est absent des méthodes récurrentes', async () => {
    methods(['ideal', 'paybybank'], ['creditcard']);
    expect(await recurringFirstMethod(cfg)).toBeNull();
  });

  it('maintient le blocage réel lorsque les reversements ne sont pas autorisés', async () => {
    methods(['ideal', 'paybybank']);
    fixture.onboarding.mockResolvedValue({
      canReceivePayments: true,
      canReceiveSettlements: false,
    });
    expect(await recurringFirstMethod({ ...cfg, mode: 'live' })).toBeNull();
    expect(fixture.request).not.toHaveBeenCalled();
    expect(fixture.onboarding).toHaveBeenCalledWith(
      { ...cfg, mode: 'live', api_key: 'status_fixture' },
      'onboarding/me',
    );
  });

  it('ne confond pas le test fictif avec une autorisation de reversement réelle', async () => {
    methods(['ideal']);
    fixture.onboarding.mockResolvedValue({
      canReceivePayments: false,
      canReceiveSettlements: false,
    });
    expect(await recurringFirstMethod(cfg)).toBe('ideal');
  });
});
