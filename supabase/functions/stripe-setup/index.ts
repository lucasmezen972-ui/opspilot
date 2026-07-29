// stripe-setup — Bootstrap Stripe webhook endpoint pour le projet.
// Appel unique par un superadmin pour configurer le webhook Stripe
// pointant vers la fonction stripe-webhook de ce projet.
// Auth : manuelle (superadmin uniquement).
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
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return json({ error: 'STRIPE_SECRET_KEY absente' }, 503);
  }

  const token = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) return json({ error: 'Non authentifié' }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return json({ error: 'Session invalide' }, 401);
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  if (!profile || profile.role !== 'superadmin') {
    return json({ error: 'Accès réservé au superadmin' }, 403);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

  const webhookUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;

  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const alreadyExists = existingWebhooks.data.some(
    (wh) => wh.url === webhookUrl && wh.status === 'enabled',
  );

  if (alreadyExists) {
    return json({
      ok: true,
      message: 'Webhook Stripe déjà configuré',
      url: webhookUrl,
    });
  }

  const webhook = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
  });

  return json({
    ok: true,
    message: 'Webhook Stripe créé avec succès',
    url: webhookUrl,
    webhookId: webhook.id,
    secret: webhook.secret,
    note: 'Copiez le secret ci-dessus dans STRIPE_WEBHOOK_SECRET (Supabase Dashboard → Settings → Edge Functions)',
  });
});
