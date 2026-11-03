export interface SepaPaymentView {
  payment_id: string;
  status: string;
  amount_cents: number;
  period_end: string | null;
  invoice_reference: string | null;
}
export interface SepaAgreementView {
  id: string;
  request_id: string;
  organization_name: string;
  plan: string;
  status: string;
  amount_cents: number;
  interval_months: 1 | 12;
  first_paid_until: string;
  next_charge_date: string;
  provider_next_charge_date: string | null;
  consented_at: string | null;
  mandate_ready: boolean;
  invoice_reference: string;
  payments: SepaPaymentView[];
}
export const sepaStatusLabel: Record<string, string> = {
  draft: 'Accord client attendu',
  authorizing: 'Autorisation en cours',
  awaiting_first_payment: 'Premier règlement attendu',
  mandate_pending: 'Vérification du mandat',
  active: 'Prélèvement programmé',
  paused: 'Calendrier arrêté — vérification nécessaire',
  canceling: 'Arrêt en cours de confirmation',
  canceled: 'Prélèvements arrêtés',
  needs_review: 'Vérification nécessaire',
};
export const money = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
export const billingDate = (date: string) =>
  new Date(date.length === 10 ? `${date}T12:00:00Z` : date).toLocaleDateString(
    'fr-FR',
    { timeZone: 'UTC' },
  );
