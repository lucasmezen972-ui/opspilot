// Supabase Edge Function — Stripe Checkout Session
// Déploiement : supabase functions deploy create-checkout-session
// Variables d'environnement requises (Supabase dashboard → Settings → Edge Functions) :
//   STRIPE_SECRET_KEY   — clé secrète Stripe (sk_live_... ou sk_test_...)
//   APP_URL             — URL de l'app (ex: https://lucasmezen972-ui.github.io/opspilot)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const STRIPE_PRICES: Record<string, string> = {
  // Remplacez par vos vrais price IDs depuis le dashboard Stripe
  essential: Deno.env.get('STRIPE_PRICE_ESSENTIAL') ?? '',
  business:  Deno.env.get('STRIPE_PRICE_BUSINESS')  ?? '',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe non configuré' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, email, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    return new Response(JSON.stringify({ error: 'Organisation introuvable' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { plan } = await req.json() as { plan: string };
  const priceId = STRIPE_PRICES[plan];
  if (!priceId) {
    return new Response(JSON.stringify({ error: `Plan invalide : ${plan}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Récupère ou crée le customer Stripe
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', profile.organization_id)
    .maybeSingle();

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile.email,
      name: profile.full_name ?? undefined,
      metadata: { organization_id: profile.organization_id, user_id: user.id },
    });
    customerId = customer.id;
  }

  const appUrl = Deno.env.get('APP_URL') ?? 'https://lucasmezen972-ui.github.io/opspilot';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url:  `${appUrl}/billing?canceled=1`,
    metadata: { organization_id: profile.organization_id, plan },
    subscription_data: {
      metadata: { organization_id: profile.organization_id, plan },
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
