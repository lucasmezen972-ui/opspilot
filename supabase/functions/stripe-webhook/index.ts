// Supabase Edge Function — Stripe Webhook
// Gère checkout.session.completed et customer.subscription.* pour mettre à jour
// la table subscriptions après un paiement Stripe.
//
// Secrets requis (Supabase Dashboard → Settings → Edge Functions) :
//   STRIPE_SECRET_KEY       — clé secrète Stripe
//   STRIPE_WEBHOOK_SECRET   — whsec_... (Stripe Dashboard → Webhooks → endpoint secret)
//
// Configurer le webhook dans Stripe Dashboard → Developers → Webhooks :
//   URL : https://hpqfmuzkkxrqoqoabjmb.supabase.co/functions/v1/stripe-webhook
//   Évènements : checkout.session.completed, customer.subscription.updated,
//                customer.subscription.deleted

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

Deno.serve(async (req: Request) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe non configuré', { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature invalide: ${err}`, { status: 400 });
  }

  // Client admin pour bypasser RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const planFromMeta = (meta: Stripe.Metadata | null) =>
    (meta?.plan as string) ?? 'essential';

  const orgFromMeta = (meta: Stripe.Metadata | null) =>
    meta?.organization_id as string | undefined;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const orgId = orgFromMeta(session.metadata);
      const plan = planFromMeta(session.metadata);
      if (!orgId) break;

      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      await supabase.from('subscriptions').upsert(
        {
          organization_id: orgId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          plan,
          status: 'active',
          current_period_end: new Date(
            sub.current_period_end * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' },
      );
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = orgFromMeta(sub.metadata);
      const plan = planFromMeta(sub.metadata);
      if (!orgId) break;

      const status =
        sub.status === 'active'
          ? 'active'
          : sub.status === 'past_due'
            ? 'past_due'
            : sub.status === 'canceled'
              ? 'canceled'
              : 'active';

      await supabase.from('subscriptions').upsert(
        {
          organization_id: orgId,
          stripe_subscription_id: sub.id,
          plan,
          status,
          current_period_end: new Date(
            sub.current_period_end * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' },
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = orgFromMeta(sub.metadata);
      if (!orgId) break;

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('organization_id', orgId);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
