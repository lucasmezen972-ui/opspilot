// stripe-worker — Synchronise les abonnements Stripe vers la table subscriptions.
// Invoqué par le cron pg_cron `stripe-sync-worker` toutes les minutes.
// Auth : jeton statique x-worker-token (stocké dans platform_settings).
// Secrets : STRIPE_SECRET_KEY
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return json({ ok: false, error: 'STRIPE_SECRET_KEY absente' }, 503);
  }

  const token = req.headers.get('x-worker-token') ?? '';
  const { data: expected } = await admin
    .from('platform_settings')
    .select('value')
    .eq('key', 'email_worker_token')
    .single();
  if (!token || token !== expected?.value?.token) {
    return json({ error: 'jeton invalide' }, 401);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

  const { data: subs, error: fetchErr } = await admin
    .from('subscriptions')
    .select('id, organization_id, stripe_subscription_id, status')
    .not('stripe_subscription_id', 'is', null)
    .in('status', ['active', 'past_due', 'trialing']);

  if (fetchErr) {
    return json({ ok: false, error: fetchErr.message }, 500);
  }

  let synced = 0;
  let errors = 0;

  for (const sub of subs ?? []) {
    if (!sub.stripe_subscription_id) continue;
    try {
      const stripeSub = await stripe.subscriptions.retrieve(
        sub.stripe_subscription_id,
      );

      const newStatus =
        stripeSub.status === 'active'
          ? 'active'
          : stripeSub.status === 'past_due'
            ? 'past_due'
            : stripeSub.status === 'canceled'
              ? 'canceled'
              : stripeSub.status === 'trialing'
                ? 'trialing'
                : sub.status;

      const periodEnd = new Date(
        stripeSub.current_period_end * 1000,
      ).toISOString();

      const planFromMeta = (stripeSub.metadata?.plan as string) ?? 'essential';

      const needsUpdate = newStatus !== sub.status;

      if (needsUpdate) {
        await admin
          .from('subscriptions')
          .update({
            status: newStatus,
            plan: planFromMeta,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);
        synced++;
      }
    } catch (err) {
      console.error(
        `stripe-worker: erreur sync ${sub.stripe_subscription_id}`,
        err,
      );
      errors++;
    }
  }

  return json({ ok: true, checked: subs?.length ?? 0, synced, errors });
});
