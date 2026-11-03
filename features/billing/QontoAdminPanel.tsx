import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MolliePaymentControls } from './MolliePaymentControls';
import { SepaAgreementsPanel } from './SepaAgreementsPanel';
import { SepaQuoteControls } from './SepaQuoteControls';
import { invoicePeriodEnd } from './invoice';
import type { BillingRequest } from '../../hooks/useQontoBilling';
import { supabase } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { colors } from '../../shared/styles/tokens';

/** Only rendered for the platform owner; RPCs also enforce this on the server. */
export function QontoAdminPanel() {
  const [requests, setRequests] = useState<BillingRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<BillingRequest | null>(null);
  const [url, setUrl] = useState('');
  const [reference, setReference] = useState('');
  const [paidUntil, setPaidUntil] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveGuard = useRef(false);
  const [revision, setRevision] = useState(0);
  const [sepaRequests, setSepaRequests] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error: loadError }, portfolio, calendars] =
        await Promise.all([
          supabase
            .from('billing_requests')
            .select('*')
            .in('status', ['requested', 'awaiting_payment'])
            .order('created_at')
            .limit(100),
          supabase.rpc('superadmin_organizations'),
          supabase.rpc('get_sepa_agreements'),
        ]);
      if ([loadError, portfolio.error, calendars.error].some(Boolean)) {
        setError(true);
        return;
      }
      setError(false);
      setSelected(null);
      setRequests(data ?? []);
      setSepaRequests(
        (calendars.data ?? [])
          .filter((a: { status: string }) => a.status !== 'canceled')
          .map((a: { request_id: string }) => a.request_id),
      );
      setNames(
        Object.fromEntries(
          (portfolio.data ?? []).map((org: { id: string; name: string }) => [
            org.id,
            org.name,
          ]),
        ),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh().catch(() => setError(true));
  }, [refresh]);
  const save = async (confirm: boolean) => {
    if (!selected || error || loading || saveGuard.current) return;
    if (confirm && !invoicePeriodEnd(paidUntil)) {
      Alert.alert(
        'Date requise',
        'Indiquez la fin de la période réellement réglée (AAAA-MM-JJ).',
      );
      return;
    }
    saveGuard.current = true;
    setSaving(true);
    try {
      const { error: saveError } = confirm
        ? await supabase.rpc('confirm_qonto_payment', {
            p_request_id: selected.id,
            p_reference: reference,
            p_paid_until: `${paidUntil}T23:59:59Z`,
          })
        : await supabase.rpc('set_qonto_payment_link', {
            p_request_id: selected.id,
            p_url: url,
            p_reference: reference,
          });
      if (saveError) {
        Alert.alert(
          'Enregistrement impossible',
          'Vérifiez le lien Qonto, la référence et vos droits.',
        );
        return;
      }
      setSelected(null);
      await refresh();
    } catch {
      Alert.alert(
        'Enregistrement non confirmé',
        'Vérifiez votre connexion puis actualisez la facture avant de réessayer.',
      );
    } finally {
      saveGuard.current = false;
      setSaving(false);
    }
  };
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          padding: 16,
          backgroundColor: '#EFF6FF',
          marginBottom: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>
          Facturation clients Qonto
        </Text>
        <Text>
          Créez la facture dans Qonto, rattachez son lien, puis confirmez
          uniquement un paiement effectivement reçu.
        </Text>
        <TouchableOpacity
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: 'center' }}
          onPress={() => Linking.openURL('https://app.qonto.com/')}
        >
          <Text style={{ color: '#2563EB', paddingVertical: 12 }}>
            Ouvrir Qonto
          </Text>
        </TouchableOpacity>
        {error && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.dangerStrong, lineHeight: 21 }}
          >
            Les factures et leurs calendriers n’ont pas pu être vérifiés.
            Actualisez les demandes avant toute modification.
          </Text>
        )}
        {loading && (
          <Text accessibilityLiveRegion="polite">
            Chargement des demandes et calendriers…
          </Text>
        )}
        {!loading && !error && requests.length === 0 && (
          <Text>Aucune demande en attente.</Text>
        )}
        <AppButton
          label="Actualiser les demandes de facturation"
          variant="secondary"
          loading={loading}
          disabled={saving}
          onPress={() => refresh().catch(() => setError(true))}
        />
        {requests.map((request) => (
          <TouchableOpacity
            key={request.id}
            accessibilityRole="button"
            disabled={error || loading || saving}
            accessibilityState={{ selected: selected?.id === request.id }}
            onPress={() => {
              setSelected(request);
              setUrl(request.payment_url ?? '');
              setReference(request.qonto_reference ?? '');
              setPaidUntil(request.paid_until?.slice(0, 10) ?? '');
            }}
            style={{
              padding: 12,
              minHeight: 44,
              borderRadius: 8,
              borderWidth: 1,
              borderColor:
                selected?.id === request.id ? colors.primary : colors.border,
              backgroundColor:
                selected?.id === request.id
                  ? colors.primarySoft
                  : colors.surface,
              marginTop: 8,
              opacity: error || loading || saving ? 0.5 : 1,
            }}
          >
            <Text>
              {names[request.organization_id] ?? 'Organisation cliente'} —{' '}
              {request.plan} —{' '}
              {request.status === 'requested'
                ? 'facture à préparer'
                : 'règlement attendu'}
            </Text>
          </TouchableOpacity>
        ))}
        {selected &&
          !error &&
          !loading &&
          sepaRequests.includes(selected.id) && (
            <Text
              style={{
                paddingVertical: 16,
                lineHeight: 21,
                color: colors.text,
              }}
            >
              Cette facture appartient à un calendrier SEPA. Utilisez les
              contrôles du calendrier ci-dessous pour éviter un second
              règlement.
            </Text>
          )}
        {selected &&
          !error &&
          !loading &&
          !sepaRequests.includes(selected.id) && (
            <View style={{ gap: 12 }}>
              {selected.payment_provider !== 'mollie' && (
                <View style={{ gap: 6 }}>
                  <Text>Lien de règlement Qonto</Text>
                  <TextInput
                    accessibilityLabel="Lien de paiement Qonto"
                    placeholder="Lien de paiement Qonto"
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    style={fieldStyle}
                  />
                </View>
              )}
              <Text>Référence de facture Qonto</Text>
              <TextInput
                accessibilityLabel="Référence de facture Qonto"
                placeholder="Référence de facture Qonto"
                value={reference}
                onChangeText={setReference}
                style={fieldStyle}
              />
              {selected.payment_provider !== 'mollie' && (
                <AppButton
                  label="Enregistrer le lien Qonto"
                  variant="secondary"
                  loading={saving}
                  onPress={() => save(false)}
                />
              )}
              <Text>Fin de la période facturée — AAAA-MM-JJ</Text>
              <TextInput
                accessibilityLabel="Fin de période réglée"
                placeholder="Fin de période réglée (AAAA-MM-JJ)"
                value={paidUntil}
                onChangeText={setPaidUntil}
                style={fieldStyle}
              />
              <MolliePaymentControls
                key={selected.id}
                request={selected}
                reference={reference}
                paidUntil={paidUntil}
                onSaved={async () => {
                  setSelected(null);
                  await refresh();
                }}
              />
              <SepaQuoteControls
                request={selected}
                reference={reference}
                paidUntil={paidUntil}
                onSaved={async () => {
                  setSelected(null);
                  setRevision((n) => n + 1);
                  await refresh();
                }}
              />
              {selected.payment_provider !== 'mollie' && (
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={saving}
                  accessibilityState={{ disabled: saving, busy: saving }}
                  style={{ minHeight: 44, paddingVertical: 12 }}
                  onPress={() =>
                    Alert.alert(
                      'Vérification du paiement',
                      'Confirmez uniquement si le règlement de cette facture est visible dans Qonto.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Paiement reçu', onPress: () => save(true) },
                      ],
                    )
                  }
                >
                  <Text style={{ color: '#166534' }}>
                    Confirmer le paiement reçu
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
      </View>
      <SepaAgreementsPanel administrator refreshKey={revision} />
    </View>
  );
}
const fieldStyle = {
  backgroundColor: colors.surface,
  padding: 12,
  minHeight: 44,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  color: colors.textStrong,
  fontSize: 16,
};
