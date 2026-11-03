import { sepaRequest } from './mollieRecurringClient.ts';
import { billingAdmin as admin, SUPABASE_URL } from './billingAuth.ts';
import { mollieRequest, type MollieConfig } from './mollie.ts';
import {
  buildSepaSubscription,
  sepaPaymentBelongs,
  type SepaAgreement,
  type SepaPayment,
} from './sepa.ts';

export async function recurringConfig(
  mode: 'test' | 'live',
): Promise<MollieConfig | null> {
  const { data, error } = await admin.rpc('get_mollie_recurring_config', {
    p_mode: mode,
  });
  return error || !data?.api_key || !data?.enabled
    ? null
    : (data as MollieConfig);
}
export async function recurringReady(cfg: MollieConfig): Promise<boolean> {
  const state = await mollieRequest<{
    canReceivePayments: boolean;
    canReceiveSettlements: boolean;
  }>({ ...cfg, api_key: cfg.status_api_key ?? '' }, 'onboarding/me');
  if (
    cfg.mode === 'live' &&
    (!state.canReceivePayments || !state.canReceiveSettlements)
  )
    return false;
  const [recurring, first] = await Promise.all([
    sepaRequest<{ _embedded: { methods: { id: string }[] } }>(
      cfg,
      'methods?sequenceType=recurring',
    ),
    sepaRequest<{ _embedded: { methods: { id: string }[] } }>(
      cfg,
      'methods?sequenceType=first',
    ),
  ]);
  return (
    recurring._embedded.methods.some((m) => m.id === 'directdebit') &&
    first._embedded.methods.some((m) => m.id === 'paybybank')
  );
}
export async function cancelRecurring(
  a: SepaAgreement,
  cfg: MollieConfig,
  actorId: string | null = null,
  finalStatus = 'canceled',
) {
  const { error: intentError } = await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    action: 'sepa.cancellation_requested',
    target: {
      agreement_id: a.id,
      mode: a.mode,
      amount_cents: a.amount_cents,
    },
  });
  if (intentError) throw new Error('cancellation_audit_unavailable');
  // Recover an ambiguous subscription creation before claiming it was stopped.
  if (
    !a.provider_subscription_id &&
    a.customer_id &&
    a.subscription_started_at
  ) {
    const list = await sepaRequest<{
      _embedded: {
        subscriptions: {
          id: string;
          status: string;
          metadata?: { agreement_id?: string };
        }[];
      };
    }>(cfg, `customers/${a.customer_id}/subscriptions`);
    for (const subscription of list._embedded.subscriptions.filter(
      (s) =>
        s.metadata?.agreement_id === a.id &&
        !['canceled', 'completed'].includes(s.status),
    ))
      await cancelRecurring(
        { ...a, provider_subscription_id: subscription.id },
        cfg,
        actorId,
        finalStatus,
      );
  }
  if (a.provider_subscription_id && a.customer_id) {
    if (
      !/^sub_[A-Za-z0-9]+$/.test(a.provider_subscription_id) ||
      !/^cst_[A-Za-z0-9]+$/.test(a.customer_id)
    )
      throw new Error('invalid_subscription');
    let current: { status: string };
    try {
      current = await sepaRequest<{ status: string }>(
        cfg,
        `customers/${a.customer_id}/subscriptions/${a.provider_subscription_id}`,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'provider_http_404')
        current = { status: 'canceled' };
      else throw error;
    }
    if (!['canceled', 'completed'].includes(current.status))
      await sepaRequest(
        cfg,
        `customers/${a.customer_id}/subscriptions/${a.provider_subscription_id}`,
        undefined,
        undefined,
        'DELETE',
      );
  }
  const { error } = await admin
    .from('mollie_recurring_agreements')
    .update({
      status: finalStatus,
      provider_status: 'canceled',
      provider_next_charge_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', a.id);
  if (error) throw new Error('cancellation_not_recorded');
  const { error: auditError } = await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    action: 'sepa.cancellation_confirmed',
    target: { agreement_id: a.id, mode: a.mode, status: finalStatus },
  });
  if (auditError) throw new Error('cancellation_audit_unavailable');
}
export async function ensureSubscription(a: SepaAgreement, cfg: MollieConfig) {
  if (
    a.provider_subscription_id ||
    !a.customer_id ||
    !a.first_payment_id ||
    !a.consented_at ||
    ['canceled', 'canceling', 'paused', 'needs_review', 'draft'].includes(
      a.status,
    )
  )
    return;
  const { data: first } = await admin
    .from('mollie_recurring_payments')
    .select('status')
    .eq('payment_id', a.first_payment_id)
    .maybeSingle();
  if (first?.status !== 'paid') return;
  if (!(await recurringReady(cfg))) return;
  const mandates = await sepaRequest<{
    _embedded: { mandates: { id: string; status: string; method: string }[] };
  }>(cfg, `customers/${a.customer_id}/mandates`);
  const mandate = mandates._embedded.mandates.find(
    (m) =>
      m.status === 'valid' &&
      m.method === 'directdebit' &&
      (!a.mandate_id || m.id === a.mandate_id),
  );
  if (!mandate) return;
  const existing = await sepaRequest<{
    _embedded: {
      subscriptions: {
        id: string;
        status: string;
        metadata?: { agreement_id?: string };
      }[];
    };
  }>(cfg, `customers/${a.customer_id}/subscriptions`);
  const matches = existing._embedded.subscriptions.filter(
    (s) => s.metadata?.agreement_id === a.id && s.status !== 'canceled',
  );
  if (matches.length > 1) throw new Error('duplicate_subscription_review');
  let subscription = matches[0];
  if (!subscription) {
    const started = a.subscription_started_at
      ? Date.parse(a.subscription_started_at)
      : 0;
    // Ambiguous creation older than Mollie's idempotence window is never replayed.
    if (started && started < Date.now() - 50 * 60000) {
      await admin
        .from('mollie_recurring_agreements')
        .update({ status: 'needs_review' })
        .eq('id', a.id);
      return;
    }
    if (!started) {
      const { data: reserved } = await admin
        .from('mollie_recurring_agreements')
        .update({
          subscription_started_at: new Date().toISOString(),
          mandate_id: mandate.id,
        })
        .eq('id', a.id)
        .is('provider_subscription_id', null)
        .is('subscription_started_at', null)
        .in('status', [
          'mandate_pending',
          'authorizing',
          'awaiting_first_payment',
        ])
        .select('id')
        .maybeSingle();
      if (!reserved) return;
    }
    subscription = await sepaRequest(
      cfg,
      `customers/${a.customer_id}/subscriptions`,
      buildSepaSubscription(a, mandate.id, SUPABASE_URL),
      a.id,
    );
  }
  if (
    !/^sub_[A-Za-z0-9]+$/.test(subscription.id) ||
    !['active', 'pending'].includes(subscription.status)
  )
    throw new Error('subscription_not_active');
  const { error } = await admin
    .from('mollie_recurring_agreements')
    .update({
      provider_subscription_id: subscription.id,
      mandate_id: mandate.id,
      status: 'active',
      provider_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', a.id)
    .in('status', ['mandate_pending', 'authorizing', 'awaiting_first_payment'])
    .select('id')
    .maybeSingle();
  if (error) throw new Error('subscription_not_recorded');
  // A cancellation may race a provider creation. Confirm local consent is still
  // active; cancel the newly discovered subscription if it was withdrawn.
  const { data: fresh } = await admin
    .from('mollie_recurring_agreements')
    .select('status')
    .eq('id', a.id)
    .single();
  if (!fresh || fresh.status !== 'active')
    await cancelRecurring(
      { ...a, provider_subscription_id: subscription.id },
      cfg,
      null,
      fresh?.status === 'needs_review' ? 'needs_review' : 'canceled',
    );
  else
    await syncSubscription(
      { ...a, provider_subscription_id: subscription.id },
      cfg,
    );
}
export async function reconcileRecurring(
  a: SepaAgreement,
  cfg: MollieConfig,
  paymentId: string,
) {
  const payment = await sepaRequest<SepaPayment>(cfg, `payments/${paymentId}`);
  if (!sepaPaymentBelongs(payment, a)) throw new Error('payment_mismatch');
  const { data, error } = await admin.rpc('apply_sepa_payment', {
    p_agreement_id: a.id,
    p_payment: payment,
  });
  if (error) throw new Error('payment_not_recorded');
  if (['failed', 'canceled', 'expired', 'needs_review'].includes(data.status)) {
    await cancelRecurring(a, cfg, null, 'needs_review');
  } else if (paymentId === a.first_payment_id) {
    const { data: fresh } = await admin
      .from('mollie_recurring_agreements')
      .select('*')
      .eq('id', a.id)
      .single();
    if (fresh) await ensureSubscription(fresh as SepaAgreement, cfg);
  }
  if (
    a.provider_subscription_id &&
    !['failed', 'canceled', 'expired', 'needs_review'].includes(data.status)
  )
    await syncSubscription(a, cfg);
  return data;
}

export async function syncSubscription(a: SepaAgreement, cfg: MollieConfig) {
  if (!a.customer_id || !a.provider_subscription_id) return;
  const subscription = await sepaRequest<{
    status: string;
    nextPaymentDate?: string;
    metadata?: { agreement_id?: string };
  }>(
    cfg,
    `customers/${a.customer_id}/subscriptions/${a.provider_subscription_id}`,
  );
  if (
    subscription.metadata?.agreement_id !== a.id ||
    (subscription.nextPaymentDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(subscription.nextPaymentDate))
  )
    throw new Error('subscription_mismatch');
  const { error } = await admin
    .from('mollie_recurring_agreements')
    .update({
      provider_status: subscription.status,
      provider_next_charge_date: subscription.nextPaymentDate ?? null,
      ...(['canceled', 'suspended', 'completed'].includes(subscription.status)
        ? { status: 'paused' }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', a.id)
    .neq('status', 'canceled')
    .neq('status', 'canceling');
  if (error) throw new Error('subscription_status_not_recorded');
}

/** Recover recent notifications that were missed, without issuing any debit. */
export async function refreshRecurring(a: SepaAgreement, cfg: MollieConfig) {
  if (a.first_payment_id) await reconcileRecurring(a, cfg, a.first_payment_id);
  if (!a.customer_id || !a.provider_subscription_id) return;
  const list = await sepaRequest<{ _embedded: { payments: { id: string }[] } }>(
    cfg,
    `customers/${a.customer_id}/subscriptions/${a.provider_subscription_id}/payments`,
  );
  for (const payment of [...list._embedded.payments].reverse())
    await reconcileRecurring(a, cfg, payment.id);
  await syncSubscription(a, cfg);
}
