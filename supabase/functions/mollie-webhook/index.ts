import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  matchesPayment,
  mollieRequest,
  readSmallBody,
  type MollieConfig,
  type MolliePayment,
  type PaymentAttempt,
} from '../_shared/mollie.ts';

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);
const reply = (status = 200) =>
  new Response(status === 200 ? 'ok' : 'retry', {
    status,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405);
  try {
    const body = await readSmallBody(req);
    if (body.length > 4096) return reply(413);
    const id = new URLSearchParams(body).get('id');
    if (!id || !/^tr_[A-Za-z0-9]{5,100}$/.test(id)) return reply(400);
    // Unknown ids do not trigger a provider request or modify any organization.
    const { data: attempt, error: readError } = await admin
      .from('mollie_payment_attempts')
      .select('*,billing_requests!inner(organization_id,plan)')
      .eq('payment_id', id)
      .maybeSingle();
    if (readError) return reply(503);
    if (!attempt) return reply();
    const { data: config, error: cfgError } = await admin.rpc(
      'get_mollie_billing_config',
      { p_mode: attempt.mode },
    );
    const cfg = config as MollieConfig | null;
    if (cfgError || !cfg?.api_key || cfg.profile_id !== attempt.profile_id)
      return reply(503);
    // The posted id is a notification only. Status, amount, tenant, profile,
    // mode and metadata are all re-fetched using our own server credential.
    const payment = await mollieRequest<MolliePayment>(cfg, `payments/${id}`);
    if (
      !matchesPayment(payment, {
        ...attempt,
        ...attempt.billing_requests,
      } as PaymentAttempt)
    )
      return reply(400);
    const { error } = await admin.rpc('apply_mollie_payment', {
      p_attempt_id: attempt.id,
      p_payment: payment,
    });
    return reply(error ? 503 : 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'body_too_large')
      return reply(413);
    return reply(503); // Mollie retries temporary failures; never log the secret.
  }
});
