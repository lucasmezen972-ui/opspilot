import type { Page } from '@playwright/test';

/** All requests are intercepted. This is not a live Supabase account. */
export async function signedInFixture(
  page: Page,
  role = 'admin',
  extra: (
    path: string,
    request: import('@playwright/test').Request,
  ) => unknown = () => undefined,
) {
  const id = '90000000-0000-4000-a000-000000000001',
    org = '90000000-0000-4000-a000-000000000002';
  const profile = {
    id,
    organization_id: org,
    store_id: null,
    email: 'browser-fixture@example.invalid',
    full_name: 'Compte de test fictif',
    role,
    is_active: true,
    xp: 0,
    level: 1,
    completed_trainings: 0,
  };
  const encode = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  const jwt = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture_signature`;
  const user = {
    id,
    email: profile.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: '2026-11-03T00:00:00Z',
  };
  await page.addInitScript(
    ({ jwt, user }) => {
      localStorage.setItem(
        'sb-hpqfmuzkkxrqoqoabjmb-auth-token',
        JSON.stringify({
          access_token: jwt,
          refresh_token: 'fixture_refresh',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        }),
      );
    },
    { jwt, user },
  );
  await page.route(/supabase\.co/, async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname;
    const custom = extra(path, request);
    if (custom !== undefined) {
      await route.fulfill({ json: custom });
      return;
    }
    let result: unknown = [];
    if (path === '/auth/v1/user') result = user;
    else if (path.endsWith('/profiles'))
      result = request.headers().accept?.includes('object')
        ? profile
        : [profile];
    else if (path.endsWith('/organizations')) {
      const row = {
        id: org,
        name: 'Entreprise fictive de contrôle',
        settings: { status: 'active' },
        subscription_plan: 'basic',
      };
      result = request.headers().accept?.includes('object') ? row : [row];
    } else if (path.endsWith('/subscriptions'))
      result = {
        id: 'fixture_subscription',
        organization_id: org,
        plan: 'trial',
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 10 * 86400000).toISOString(),
      };
    else if (path.includes('/functions/v1/'))
      result = { configured: false, ready: false };
    await route.fulfill({ json: result });
  });
  return { id, org };
}
