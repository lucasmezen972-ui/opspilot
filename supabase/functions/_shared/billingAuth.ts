import { createClient } from 'npm:@supabase/supabase-js@2.55.0';

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
export const billingAdmin = createClient(
  SUPABASE_URL,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);
export const billingCors = {
  'Access-Control-Allow-Origin': 'https://opspilot-mu-six.vercel.app',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
export const billingJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...billingCors, 'Content-Type': 'application/json' },
  });
export async function billingActor(req: Request) {
  const jwt = (req.headers.get('Authorization') ?? '').replace(
    /^Bearer\s+/i,
    '',
  );
  if (!jwt) return null;
  const { data: auth, error } = await billingAdmin.auth.getUser(jwt);
  if (error || !auth.user) return null;
  const { data: actor } = await billingAdmin
    .from('profiles')
    .select(
      'id,organization_id,role,email,full_name,is_active,organizations(settings,name)',
    )
    .eq('id', auth.user.id)
    .single();
  if (
    !actor?.is_active ||
    !['admin', 'owner', 'superadmin'].includes(actor.role)
  )
    return null;
  const organization = Array.isArray(actor.organizations)
    ? actor.organizations[0]
    : actor.organizations;
  if (
    actor.role !== 'superadmin' &&
    organization?.settings?.status === 'suspended'
  )
    return null;
  if (actor.role === 'superadmin') {
    const { data, error: factorError } =
      await billingAdmin.auth.admin.mfa.listFactors({ userId: auth.user.id });
    if (factorError) return null;
    if (data.factors.some((f) => f.status === 'verified')) {
      try {
        const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        if (
          JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')))
            .aal !== 'aal2'
        )
          return null;
      } catch {
        return null;
      }
    }
  }
  const { data: allowed, error: rateError } = await billingAdmin.rpc(
    'check_ai_rate_limit',
    { rate_key: `sepa:${actor.id}`, max_requests: 20, window_seconds: 60 },
  );
  if (rateError || !allowed) return null;
  return { ...actor, organization };
}
