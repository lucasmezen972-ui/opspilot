import { sepaRequest } from '../_shared/mollieRecurringClient.ts';
import {
  billingActor,
  billingAdmin as admin,
  billingCors,
  billingJson as json,
  SUPABASE_URL,
} from '../_shared/billingAuth.ts';
import { isMollieCheckoutUrl, readSmallBody } from '../_shared/mollie.ts';
import {
  buildFirstSepaPayment,
  sepaPaymentBelongs,
  type SepaAgreement,
  type SepaPayment,
} from '../_shared/sepa.ts';
import {
  cancelRecurring,
  reconcileRecurring,
  recurringConfig,
  recurringFirstMethod,
  recurringReady,
  refreshRecurring,
} from '../_shared/sepaLifecycle.ts';

const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: billingCors });
  if (req.method !== 'POST')
    return json({ error: 'Méthode non autorisée' }, 405);
  try {
    const actor = await billingActor(req);
    if (!actor) return json({ error: 'Session ou droits insuffisants' }, 401);
    const input = JSON.parse(await readSmallBody(req));
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return json({ error: 'Demande invalide' }, 400);
    if (input.action === 'status') {
      const cfg = await recurringConfig('live');
      if (!cfg) return json({ configured: false, ready: false });
      return json({ configured: true, ready: await recurringReady(cfg) });
    }
    if (input.action === 'quote') {
      if (actor.role !== 'superadmin')
        return json({ error: 'Accès réservé à la facturation' }, 403);
      const mode = input.mode === 'test' ? 'test' : 'live';
      if (
        !uuid(input.request_id) ||
        !Number.isInteger(input.amount_cents) ||
        ![1, 12].includes(input.interval_months) ||
        typeof input.invoice_reference !== 'string' ||
        typeof input.paid_until !== 'string'
      )
        return json({ error: 'Facture et calendrier requis' }, 400);
      // Preparing a quote never starts a payment, even while the provider is reviewing the account.
      const { data: base } = await admin.rpc('get_mollie_billing_config', {
        p_mode: mode,
      });
      const { data, error } = await admin.rpc('prepare_sepa_agreement', {
        p_actor_id: actor.id,
        p_request_id: input.request_id,
        p_amount_cents: input.amount_cents,
        p_invoice_reference: input.invoice_reference,
        p_first_paid_until: input.paid_until,
        p_interval_months: input.interval_months,
        p_mode: mode,
        p_profile_id: base?.profile_id,
      });
      if (error)
        return json(
          {
            error:
              'Cette facture ou ce calendrier ne peut pas être préparé. Vérifiez les règlements existants et une première période d’au moins 14 jours.',
          },
          409,
        );
      return json({ agreement_id: data.id, status: data.status });
    }
    if (!uuid(input.agreement_id))
      return json({ error: 'Calendrier manquant' }, 400);
    const { data: row } = await admin
      .from('mollie_recurring_agreements')
      .select('*')
      .eq('id', input.agreement_id)
      .maybeSingle();
    if (
      !row ||
      (actor.role !== 'superadmin' &&
        actor.organization_id !== row.organization_id)
    )
      return json({ error: 'Calendrier introuvable' }, 404);
    let a = row as SepaAgreement;
    const cfg = await recurringConfig(a.mode);
    if (input.action === 'attach_invoice') {
      if (
        actor.role !== 'superadmin' ||
        typeof input.reference !== 'string' ||
        !input.reference.trim() ||
        input.reference.length > 200 ||
        typeof input.payment_id !== 'string'
      )
        return json({ error: 'Référence de facture invalide' }, 403);
      if (typeof input.paid_until !== 'string')
        return json({ error: 'Période de la facture requise' }, 400);
      const { error } = await admin.rpc('reconcile_sepa_invoice', {
        p_actor_id: actor.id,
        p_agreement_id: a.id,
        p_payment_id: input.payment_id,
        p_reference: input.reference.trim(),
        p_paid_until: input.paid_until,
      });
      return error
        ? json(
            {
              error:
                'Vérifiez le règlement, la référence et la période Qonto. Une facture rapprochée ne peut pas être réaffectée.',
            },
            409,
          )
        : json({ saved: true });
    }
    if (input.action === 'cancel') {
      if (!a.provider_subscription_id && !a.first_payment_id) {
        const { error } = await admin
          .from('mollie_recurring_agreements')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('id', a.id);
        return error
          ? json({ error: 'Arrêt non enregistré' }, 503)
          : json({ canceled: true });
      }
      if (!cfg)
        return json(
          {
            error:
              'Le service ne peut pas encore confirmer l’arrêt. Contactez contact@tradikom.com.',
          },
          503,
        );
      await admin
        .from('mollie_recurring_agreements')
        .update({ status: 'canceling' })
        .eq('id', a.id);
      await cancelRecurring(a, cfg, actor.id);
      return json({ canceled: true });
    }
    if (!cfg)
      return json(
        {
          error:
            'Le prélèvement est en cours de configuration. Aucun débit n’a été lancé.',
        },
        503,
      );
    if (input.action === 'refresh') {
      await refreshRecurring(a, cfg);
      return json({ refreshed: true });
    }
    if (
      input.action !== 'authorize' ||
      input.accepted !== true ||
      actor.role === 'superadmin'
    )
      return json({ error: 'Accord du représentant client requis' }, 400);
    const firstMethod = await recurringFirstMethod(cfg);
    if (!firstMethod)
      return json(
        {
          error:
            'Mollie ne permet pas encore le prélèvement. Aucun débit n’a été lancé.',
        },
        409,
      );
    if (
      a.first_payment_id &&
      isMollieCheckoutUrl(a.checkout_url) &&
      ['authorizing', 'awaiting_first_payment'].includes(a.status)
    ) {
      await attachFirstInvoice(a);
      return json({ payment_url: a.checkout_url });
    }
    const { data: consented, error: consentError } = await admin.rpc(
      'consent_sepa_agreement',
      { p_actor_id: actor.id, p_agreement_id: a.id },
    );
    if (consentError)
      return json(
        { error: 'Le calendrier doit être vérifié avant de poursuivre' },
        409,
      );
    a = consented as SepaAgreement;
    if (
      a.creation_started_at &&
      Date.parse(a.creation_started_at) < Date.now() - 50 * 60000
    ) {
      await admin
        .from('mollie_recurring_agreements')
        .update({ status: 'needs_review' })
        .eq('id', a.id);
      return json(
        {
          error:
            'Une vérification du règlement est nécessaire avant une nouvelle tentative',
        },
        409,
      );
    }
    if (!a.customer_id) {
      const customer = await sepaRequest<{ id: string }>(
        cfg,
        'customers',
        {
          name: actor.organization?.name ?? actor.full_name,
          email: actor.email,
          locale: 'fr_FR',
          metadata: { purpose: 'opspilot_sepa_v1', agreement_id: a.id },
        },
        `customer-${a.id}`,
      );
      if (!/^cst_[A-Za-z0-9]+$/.test(customer.id))
        throw new Error('customer_mismatch');
      const { error } = await admin
        .from('mollie_recurring_agreements')
        .update({ customer_id: customer.id })
        .eq('id', a.id);
      if (error) throw new Error('customer_not_recorded');
      a = { ...a, customer_id: customer.id };
    }
    const payment = await sepaRequest<SepaPayment>(
      cfg,
      'payments',
      buildFirstSepaPayment(a, SUPABASE_URL, firstMethod),
      `first-${a.id}`,
    );
    if (
      !sepaPaymentBelongs(payment, { ...a, first_payment_id: payment.id }) ||
      !isMollieCheckoutUrl(payment._links?.checkout?.href)
    )
      throw new Error('payment_mismatch');
    const { data: saved, error: saveError } = await admin
      .from('mollie_recurring_agreements')
      .update({
        first_payment_id: payment.id,
        checkout_url: payment._links.checkout.href,
        status: 'awaiting_first_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', a.id)
      .in('status', ['authorizing', 'awaiting_first_payment'])
      .select('id')
      .maybeSingle();
    if (saveError || !saved) throw new Error('payment_not_recorded');
    await attachFirstInvoice({
      ...a,
      first_payment_id: payment.id,
      checkout_url: payment._links.checkout.href,
    });
    return json({ payment_url: payment._links.checkout.href });
  } catch (error) {
    if (error instanceof Error && error.message === 'body_too_large')
      return json({ error: 'Demande trop longue' }, 413);
    if (error instanceof SyntaxError)
      return json({ error: 'Demande invalide' }, 400);
    return json(
      {
        error:
          'Le service est temporairement indisponible. Votre calendrier reste enregistré ; réessayez sans créer de nouvelle facture.',
      },
      503,
    );
  }
});

async function attachFirstInvoice(a: SepaAgreement) {
  if (a.mode !== 'live') return;
  const { data: r, error: readError } = await admin
    .from('billing_requests')
    .select('status,mollie_payment_id')
    .eq('id', a.request_id)
    .single();
  if (readError) throw new Error('invoice_not_read');
  if (
    r.mollie_payment_id === a.first_payment_id &&
    ['awaiting_payment', 'paid'].includes(r.status)
  )
    return;
  if (r.status !== 'requested' || r.mollie_payment_id)
    throw new Error('invoice_already_bound');
  const { data, error } = await admin
    .from('billing_requests')
    .update({
      payment_provider: 'mollie',
      mollie_payment_id: a.first_payment_id,
      payment_url: a.checkout_url,
      qonto_reference: a.invoice_reference,
      amount_cents: a.amount_cents,
      paid_until: a.first_paid_until,
      status: 'awaiting_payment',
    })
    .eq('id', a.request_id)
    .eq('status', 'requested')
    .is('mollie_payment_id', null)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new Error('invoice_not_recorded');
}
