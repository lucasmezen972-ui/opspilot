import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  buildPayment,
  isMollieCheckoutUrl,
  matchesPayment,
  mollieRequest,
  readSmallBody,
  type MollieConfig,
  type MolliePayment,
  type PaymentAttempt,
} from '../_shared/mollie.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const admin = createClient(
  SUPABASE_URL,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);
const cors = {
  'Access-Control-Allow-Origin': 'https://opspilot-mu-six.vercel.app',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')
    return json({ error: 'Méthode non autorisée' }, 405);
  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    if (!jwt) return json({ error: 'Session invalide' }, 401);
    const { data: auth, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !auth.user)
      return json({ error: 'Session invalide' }, 401);
    const { data: actor } = await admin
      .from('profiles')
      .select('id,role,is_active')
      .eq('id', auth.user.id)
      .single();
    if (!actor?.is_active || actor.role !== 'superadmin')
      return json({ error: 'Accès réservé à la facturation' }, 403);
    // Preserve the platform's MFA requirement on this new privileged endpoint.
    const { data: factorData, error: factorError } =
      await admin.auth.admin.mfa.listFactors({ userId: auth.user.id });
    if (factorError)
      return json({ error: 'Vérification de sécurité indisponible' }, 503);
    if (
      (factorData?.factors ?? []).some((factor) => factor.status === 'verified')
    ) {
      let aal = '';
      try {
        const encoded = (jwt.split('.')[1] ?? '')
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
        aal = JSON.parse(atob(padded))?.aal ?? '';
      } catch {
        aal = '';
      }
      if (aal !== 'aal2') return json({ error: 'Validation 2FA requise' }, 401);
    }
    const { data: allowed, error: rateError } = await admin.rpc(
      'check_ai_rate_limit',
      {
        rate_key: `mollie-billing:${actor.id}`,
        max_requests: 12,
        window_seconds: 60,
      },
    );
    if (rateError || !allowed)
      return json({ error: 'Réessayez dans une minute.' }, 429);
    const raw = await readSmallBody(req);
    if (raw.length > 4096) return json({ error: 'Demande trop longue' }, 413);
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return json({ error: 'Demande invalide' }, 400);
    const mode = input.mode === 'test' ? 'test' : 'live';
    const { data: config, error: configError } = await admin.rpc(
      'get_mollie_billing_config',
      { p_mode: mode },
    );
    const cfg = config as MollieConfig | null;
    if (configError || !cfg?.api_key || !cfg.profile_id || !cfg.enabled)
      return json(
        { error: 'Paiement par carte non configuré', configured: false },
        503,
      );
    if (input.action === 'status' || input.action === 'create') {
      const onboarding = await mollieRequest<{
        status: string;
        canReceivePayments: boolean;
        canReceiveSettlements: boolean;
      }>({ ...cfg, api_key: cfg.status_api_key ?? '' }, 'onboarding/me');
      const ready =
        onboarding.canReceivePayments === true &&
        onboarding.canReceiveSettlements === true;
      if (input.action === 'status')
        return json({
          configured: true,
          ready,
          mode,
          status: onboarding.status,
          canReceivePayments: onboarding.canReceivePayments,
          canReceiveSettlements: onboarding.canReceiveSettlements,
        });
      if (mode === 'live' && !ready)
        return json(
          {
            error:
              'Mollie vérifie encore le compte. Le paiement sera disponible après validation.',
          },
          409,
        );
      if (
        !Number.isInteger(input.amount_cents) ||
        input.amount_cents < 50 ||
        input.amount_cents > 1000000 ||
        typeof input.invoice_reference !== 'string' ||
        !input.invoice_reference.trim() ||
        input.invoice_reference.length > 200 ||
        typeof input.request_id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(input.request_id) ||
        typeof input.paid_until !== 'string' ||
        !Number.isFinite(Date.parse(input.paid_until))
      )
        return json({ error: 'Facture, montant TTC ou période invalide' }, 400);
      const { data, error } = await admin.rpc('prepare_mollie_payment', {
        p_request_id: input.request_id,
        p_actor_id: actor.id,
        p_amount_cents: input.amount_cents,
        p_invoice_reference: input.invoice_reference,
        p_paid_until: input.paid_until,
        p_mode: mode,
        p_profile_id: cfg.profile_id,
      });
      if (error || !data)
        return json({ error: error?.message ?? 'Facture non payable' }, 409);
      const attempt = data as PaymentAttempt;
      if (attempt.payment_id && isMollieCheckoutUrl(attempt.checkout_url))
        return json({
          payment_url: attempt.checkout_url,
          payment_id: attempt.payment_id,
        });
      const payment = await mollieRequest<MolliePayment>(
        cfg,
        'payments',
        buildPayment(attempt, cfg.app_url, SUPABASE_URL),
        attempt.id,
      );
      if (
        !matchesPayment(payment, { ...attempt, payment_id: payment.id }) ||
        !isMollieCheckoutUrl(payment._links?.checkout?.href)
      )
        return json(
          { error: 'Réponse de paiement incohérente. Vérification requise.' },
          502,
        );
      const { error: saveError } = await admin.rpc('attach_mollie_payment', {
        p_attempt_id: attempt.id,
        p_payment_id: payment.id,
        p_checkout_url: payment._links.checkout.href,
      });
      if (saveError)
        return json(
          {
            error:
              'Paiement créé mais liaison en attente. Réessayez la même facture.',
          },
          503,
        );
      return json({
        payment_url: payment._links.checkout.href,
        payment_id: payment.id,
      });
    }
    if (
      input.action === 'refresh' &&
      typeof input.payment_id === 'string' &&
      /^tr_[A-Za-z0-9]{5,100}$/.test(input.payment_id)
    ) {
      const { data: attempt } = await admin
        .from('mollie_payment_attempts')
        .select('*,billing_requests!inner(organization_id,plan)')
        .eq('payment_id', input.payment_id)
        .eq('mode', mode)
        .maybeSingle();
      if (!attempt) return json({ error: 'Paiement introuvable' }, 404);
      const bound = {
        ...attempt,
        ...attempt.billing_requests,
      } as PaymentAttempt;
      const payment = await mollieRequest<MolliePayment>(
        cfg,
        `payments/${input.payment_id}`,
      );
      if (!matchesPayment(payment, bound))
        return json({ error: 'Paiement non conforme' }, 409);
      const { data, error } = await admin.rpc('apply_mollie_payment', {
        p_attempt_id: attempt.id,
        p_payment: payment,
      });
      if (error) return json({ error: 'Vérification non finalisée' }, 503);
      return json(data);
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch {
    // Never echo provider errors, request bodies or credentials to the browser.
    return json(
      {
        error:
          'Le service de paiement est temporairement indisponible. Réessayez la même facture.',
      },
      503,
    );
  }
});
