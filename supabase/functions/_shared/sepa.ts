import { euroCents, type MolliePayment } from './mollie.ts';

export interface SepaAgreement {
  id: string;
  organization_id: string;
  request_id: string;
  created_by: string;
  profile_id: string;
  mode: 'test' | 'live';
  plan: string;
  amount_cents: number;
  invoice_reference: string;
  first_paid_until: string;
  next_charge_date: string;
  interval_months: 1 | 12;
  status: string;
  consented_at: string | null;
  customer_id: string | null;
  first_payment_id: string | null;
  checkout_url: string | null;
  mandate_id: string | null;
  provider_subscription_id: string | null;
  creation_started_at: string | null;
  subscription_started_at: string | null;
}
export type SepaPayment = MolliePayment & {
  customerId?: string;
  subscriptionId?: string;
  sequenceType?: string;
  method?: string;
  createdAt?: string;
};
export type SepaFirstMethod = 'paybybank' | 'ideal';

/** Both methods create a directdebit mandate; a card creates a card mandate. */
export function selectSepaFirstMethod(
  methods: { id: string }[],
): SepaFirstMethod | null {
  if (methods.some((method) => method.id === 'paybybank')) return 'paybybank';
  if (methods.some((method) => method.id === 'ideal')) return 'ideal';
  return null;
}

export function sepaPaymentBelongs(
  payment: SepaPayment,
  agreement: SepaAgreement,
): boolean {
  if (
    !/^tr_[A-Za-z0-9]{5,100}$/.test(payment.id) ||
    payment.profileId !== agreement.profile_id ||
    payment.mode !== agreement.mode ||
    payment.customerId !== agreement.customer_id ||
    payment.amount.currency !== 'EUR' ||
    euroCents(payment.amount.value) !== agreement.amount_cents
  )
    return false;
  return payment.id === agreement.first_payment_id
    ? payment.sequenceType === 'first' &&
        (payment.method === 'paybybank' || payment.method === 'ideal') &&
        payment.metadata?.purpose === 'opspilot_sepa_v1' &&
        payment.metadata?.agreement_id === agreement.id
    : Boolean(agreement.provider_subscription_id) &&
        payment.subscriptionId === agreement.provider_subscription_id &&
        payment.sequenceType === 'recurring' &&
        payment.method === 'directdebit';
}
export function buildFirstSepaPayment(
  a: SepaAgreement,
  supabaseUrl: string,
  method: SepaFirstMethod,
) {
  if (method !== 'paybybank' && method !== 'ideal')
    throw new Error('invalid_first_payment_method');
  return {
    amount: { currency: 'EUR', value: (a.amount_cents / 100).toFixed(2) },
    customerId: a.customer_id,
    sequenceType: 'first',
    method,
    description: `OpsPilot — facture ${a.invoice_reference}`.slice(0, 255),
    locale: 'fr_FR',
    redirectUrl: 'https://opspilot-mu-six.vercel.app/billing?sepa_return=1',
    webhookUrl: `${supabaseUrl}/functions/v1/mollie-recurring-webhook`,
    metadata: {
      purpose: 'opspilot_sepa_v1',
      agreement_id: a.id,
      organization_id: a.organization_id,
    },
  };
}
export function buildSepaSubscription(
  a: SepaAgreement,
  mandateId: string,
  supabaseUrl: string,
  now = new Date(),
) {
  if (
    !a.consented_at ||
    !a.customer_id ||
    !/^mdt_[A-Za-z0-9]+$/.test(mandateId) ||
    ![1, 12].includes(a.interval_months)
  )
    throw new Error('invalid_agreement');
  const start = Date.parse(`${a.next_charge_date}T00:00:00Z`);
  const consent = Date.parse(a.consented_at);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(consent) ||
    start < now.getTime() ||
    start - consent < 14 * 86400000
  )
    throw new Error('schedule_requires_review');
  return {
    amount: { currency: 'EUR', value: (a.amount_cents / 100).toFixed(2) },
    interval: `${a.interval_months} month${a.interval_months === 1 ? '' : 's'}`,
    startDate: a.next_charge_date,
    mandateId,
    method: 'directdebit',
    description: `OpsPilot ${a.plan} — ${a.id}`.slice(0, 255),
    webhookUrl: `${supabaseUrl}/functions/v1/mollie-recurring-webhook`,
    metadata: { purpose: 'opspilot_sepa_v1', agreement_id: a.id },
  };
}
