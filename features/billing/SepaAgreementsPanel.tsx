import { Check } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Text, TextInput, View } from 'react-native';

import { invoicePeriodEnd } from './invoice';
import {
  billingDate,
  money,
  sepaStatusLabel,
  type SepaAgreementView,
  type SepaPaymentView,
} from './sepa';
import { supabase } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { ChoiceControl } from '../../shared/components/ChoiceControl';
import { colors } from '../../shared/styles/tokens';

async function action(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('mollie-recurring', {
    body,
  });
  if (error || data?.error) {
    let message = data?.error;
    if (!message && error?.context instanceof Response) {
      try {
        message = (await error.context.json())?.error;
      } catch {
        /* No usable server response. */
      }
    }
    throw new Error(
      typeof message === 'string'
        ? message
        : 'Le service SEPA est indisponible. Réessayez ou contactez contact@tradikom.com.',
    );
  }
  return data;
}

function RenewalInvoice({
  agreementId,
  payment,
  onSaved,
}: {
  agreementId: string;
  payment: SepaPaymentView;
  onSaved: () => Promise<void>;
}) {
  const [reference, setReference] = useState('');
  const [until, setUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <View
      style={{
        gap: 8,
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: colors.textStrong }}>
        Règlement reçu : {money(payment.amount_cents)} — facture à rapprocher
      </Text>
      <Text>
        Créez la facture dans Qonto, puis renseignez sa référence et la période
        exacte. L’accès n’est pas prolongé avant ce rapprochement.
      </Text>
      <Text style={{ color: colors.textStrong, fontWeight: '600' }}>
        Référence de la facture Qonto
      </Text>
      <TextInput
        accessibilityLabel="Référence de la facture de renouvellement"
        placeholder="Référence Qonto"
        value={reference}
        onChangeText={setReference}
        style={inputStyle}
      />
      <Text style={{ color: colors.textStrong, fontWeight: '600' }}>
        Fin de la période facturée (AAAA-MM-JJ)
      </Text>
      <TextInput
        accessibilityLabel="Fin de période du renouvellement"
        placeholder="Fin de période (AAAA-MM-JJ)"
        value={until}
        onChangeText={setUntil}
        style={inputStyle}
      />
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.dangerStrong }}>
          {error}
        </Text>
      )}
      <AppButton
        label="Rapprocher cette facture"
        variant="secondary"
        loading={busy}
        onPress={async () => {
          const period = invoicePeriodEnd(until);
          if (!period || !reference.trim()) {
            setError('Renseignez la référence et une fin de période valide.');
            return;
          }
          setBusy(true);
          setError('');
          try {
            await action({
              action: 'attach_invoice',
              agreement_id: agreementId,
              payment_id: payment.payment_id,
              reference: reference.trim(),
              paid_until: period,
            });
            await onSaved();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'Rapprochement impossible.',
            );
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}

export function SepaAgreementsPanel({
  administrator = false,
  isLocalDemo = false,
  refreshKey = 0,
  onChanged,
}: {
  administrator?: boolean;
  isLocalDemo?: boolean;
  refreshKey?: number;
  onChanged?: () => Promise<void>;
}) {
  const [agreements, setAgreements] = useState<SepaAgreementView[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(!isLocalDemo);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const guard = useRef(false);
  const load = useCallback(async () => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: issue } = await supabase.rpc('get_sepa_agreements');
      if (issue)
        throw new Error(
          'Le calendrier de prélèvement ne peut pas être chargé.',
        );
      setAgreements(data ?? []);
      const status = await action({ action: 'status' });
      setReady(status?.ready === true);
    } catch (e) {
      setReady(false);
      setError(e instanceof Error ? e.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [isLocalDemo]);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  const perform = async (
    a: SepaAgreementView,
    kind: 'authorize' | 'refresh' | 'cancel',
  ) => {
    if (guard.current) return;
    guard.current = true;
    setBusy(a.id);
    setError('');
    try {
      const result = await action({
        action: kind,
        agreement_id: a.id,
        ...(kind === 'authorize' ? { accepted: true } : {}),
      });
      if (kind === 'authorize' && result?.payment_url) {
        const { isMollieCheckoutUrl } = await import(
          '../../supabase/functions/_shared/mollie'
        );
        if (!isMollieCheckoutUrl(result.payment_url))
          throw new Error('Lien de règlement invalide.');
        await Linking.openURL(result.payment_url);
      }
      await load();
      await onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible.');
    } finally {
      guard.current = false;
      setBusy(null);
    }
  };
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
      }}
      testID="sepa-panel"
    >
      <Text
        accessibilityRole="header"
        style={{ fontSize: 18, fontWeight: '700', color: colors.textStrong }}
      >
        Prélèvement SEPA
      </Text>
      <Text style={{ color: colors.text, lineHeight: 21 }}>
        {isLocalDemo
          ? 'Mode démo : aucun mandat ni règlement ne peut être créé.'
          : ready
            ? 'Le service peut recevoir les autorisations de prélèvement.'
            : 'Activation Mollie et configuration en attente. Aucun prélèvement automatique ne peut être démarré ici.'}
      </Text>
      {loading && (
        <Text accessibilityLiveRegion="polite">
          Vérification du calendrier…
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.dangerStrong }}>
          {error}
        </Text>
      )}
      {!isLocalDemo && (
        <AppButton
          variant="secondary"
          label="Actualiser le calendrier SEPA"
          onPress={load}
          disabled={loading || busy !== null}
        />
      )}
      {!loading && !error && !isLocalDemo && agreements.length === 0 && (
        <Text style={{ color: colors.textMuted }}>
          Aucun calendrier SEPA préparé. Vous pouvez demander une facture depuis
          les offres ci-dessous.
        </Text>
      )}
      {agreements.map((a) => (
        <View
          key={a.id}
          style={{
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 16,
          }}
        >
          {administrator && (
            <Text style={{ fontWeight: '700' }}>{a.organization_name}</Text>
          )}
          <Text style={{ color: colors.primaryDark, fontWeight: '600' }}>
            {sepaStatusLabel[a.status] ?? 'État à vérifier'}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textStrong,
            }}
          >
            {money(a.amount_cents)} TTC /{' '}
            {a.interval_months === 12 ? 'an' : 'mois'}
          </Text>
          <Text style={{ lineHeight: 21, color: colors.text }}>
            Premier règlement : facture {a.invoice_reference}, pour la période
            jusqu’au {billingDate(a.first_paid_until)}. Puis{' '}
            {money(a.amount_cents)} tous les{' '}
            {a.interval_months === 12 ? '12 mois' : 'mois'}, à partir du{' '}
            {billingDate(a.next_charge_date)}.
          </Text>
          {a.provider_next_charge_date && a.status === 'active' && (
            <Text>
              Prochaine échéance confirmée par Mollie :{' '}
              {billingDate(a.provider_next_charge_date)}.
            </Text>
          )}
          <Text style={{ color: colors.textMuted }}>
            Mandat :{' '}
            {a.mandate_ready
              ? 'vérifié auprès de Mollie'
              : 'non encore confirmé'}
            . Factures émises dans Qonto.
          </Text>
          {!administrator &&
            ['draft', 'authorizing', 'awaiting_first_payment'].includes(
              a.status,
            ) && (
              <>
                <ChoiceControl
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: accepted[a.id] === true }}
                  aria-checked={accepted[a.id] === true}
                  onPress={() =>
                    setAccepted((x) => ({ ...x, [a.id]: !x[a.id] }))
                  }
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    paddingVertical: 12,
                    minHeight: 44,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderRadius: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {accepted[a.id] && (
                      <Check size={18} color={colors.primary} />
                    )}
                  </View>
                  <Text style={{ flex: 1, lineHeight: 21, color: colors.text }}>
                    Je représente cette organisation et j’accepte ce montant,
                    cette fréquence et ce calendrier. Je recevrai le mandat chez
                    Mollie. Le premier règlement est effectué via ma banque ;
                    les échéances suivantes utilisent le prélèvement SEPA. Je
                    peux arrêter les échéances futures ici.
                  </Text>
                </ChoiceControl>
                <AppButton
                  label="Accepter et ouvrir ma banque avec Mollie"
                  onPress={() => perform(a, 'authorize')}
                  disabled={!ready || accepted[a.id] !== true || busy !== null}
                  loading={busy === a.id}
                />
              </>
            )}
          <View style={{ gap: 8 }}>
            {!['draft', 'canceled'].includes(a.status) && (
              <AppButton
                label="Vérifier le mandat et les règlements"
                variant="secondary"
                onPress={() => perform(a, 'refresh')}
                disabled={busy !== null}
              />
            )}
            {a.status !== 'canceled' && (
              <AppButton
                label="Arrêter les prochaines échéances"
                variant="secondary"
                disabled={busy !== null}
                onPress={() =>
                  Alert.alert(
                    'Arrêter le calendrier SEPA',
                    'Les échéances futures seront arrêtées après confirmation de Mollie. Un règlement déjà en cours peut encore aboutir. La période déjà réglée est conservée.',
                    [
                      { text: 'Retour', style: 'cancel' },
                      {
                        text: 'Arrêter les échéances',
                        onPress: () => perform(a, 'cancel'),
                      },
                    ],
                  )
                }
              />
            )}
          </View>
          {a.payments.map((p) => (
            <View key={p.payment_id} style={{ gap: 4, paddingVertical: 8 }}>
              <Text style={{ color: colors.textStrong }}>
                {money(p.amount_cents)} —{' '}
                {p.status === 'paid'
                  ? 'reçu'
                  : p.status === 'needs_review'
                    ? 'remboursement ou contestation à vérifier'
                    : ['failed', 'expired', 'canceled'].includes(p.status)
                      ? 'non réglé'
                      : 'en cours'}
              </Text>
              <Text style={{ color: colors.textMuted }}>
                {p.invoice_reference
                  ? `Facture ${p.invoice_reference}`
                  : 'Facture Qonto à rapprocher'}
                {p.period_end
                  ? ` · période jusqu’au ${billingDate(p.period_end)}`
                  : ''}
              </Text>
              {administrator && p.status === 'paid' && !p.invoice_reference && (
                <RenewalInvoice agreementId={a.id} payment={p} onSaved={load} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
const inputStyle = {
  padding: 12,
  minHeight: 44,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  backgroundColor: colors.surface,
  color: colors.textStrong,
  fontSize: 16,
};
