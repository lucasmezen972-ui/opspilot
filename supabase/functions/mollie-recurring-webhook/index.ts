import { sepaRequest } from '../_shared/mollieRecurringClient.ts';
import { billingAdmin as admin } from '../_shared/billingAuth.ts';
import { readSmallBody } from '../_shared/mollie.ts';
import {
  sepaPaymentBelongs,
  type SepaAgreement,
  type SepaPayment,
} from '../_shared/sepa.ts';
import {
  reconcileRecurring,
  recurringConfig,
} from '../_shared/sepaLifecycle.ts';

const reply = (status = 200) =>
  new Response(status === 200 ? 'ok' : 'retry', {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' },
  });
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply(405);
  try {
    const id = new URLSearchParams(await readSmallBody(req)).get('id');
    if (!id || !/^tr_[A-Za-z0-9]{5,100}$/.test(id)) return reply(400);
    const { data: known, error } = await admin
      .from('mollie_recurring_agreements')
      .select('*')
      .eq('first_payment_id', id)
      .maybeSingle();
    if (error) return reply(503);
    if (known) {
      const cfg = await recurringConfig(known.mode);
      if (!cfg) return reply(503);
      await reconcileRecurring(known as SepaAgreement, cfg, id);
      return reply();
    }
    // A subscription creates new payment IDs. Re-fetch from Mollie before binding
    // the notification to a known customer + subscription; never trust its body.
    const { data: allowed } = await admin.rpc('check_ai_rate_limit', {
      rate_key: 'sepa:unknown-webhook',
      max_requests: 30,
      window_seconds: 60,
    });
    if (!allowed) return reply(429);
    let providerUnavailable = false;
    for (const mode of ['live', 'test'] as const) {
      const cfg = await recurringConfig(mode);
      if (!cfg) continue;
      let payment: SepaPayment;
      try {
        payment = await sepaRequest<SepaPayment>(cfg, `payments/${id}`);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'provider_http_404')
          providerUnavailable = true;
        continue;
      }
      if (
        !payment.subscriptionId ||
        !payment.customerId ||
        !/^sub_[A-Za-z0-9]+$/.test(payment.subscriptionId)
      )
        continue;
      const { data: a, error: readError } = await admin
        .from('mollie_recurring_agreements')
        .select('*')
        .eq('provider_subscription_id', payment.subscriptionId)
        .eq('customer_id', payment.customerId)
        .eq('mode', mode)
        .maybeSingle();
      if (readError) return reply(503);
      if (!a || !sepaPaymentBelongs(payment, a as SepaAgreement)) continue;
      await reconcileRecurring(a as SepaAgreement, cfg, id);
      return reply();
    }
    return reply(providerUnavailable ? 503 : 200);
  } catch (error) {
    return reply(
      error instanceof Error && error.message === 'body_too_large' ? 413 : 503,
    );
  }
});
