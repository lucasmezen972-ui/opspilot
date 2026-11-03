import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MolliePaymentControls } from './MolliePaymentControls';
import { invoicePeriodEnd } from './invoice';
import type { BillingRequest } from '../../hooks/useQontoBilling';
import { supabase } from '../../lib/supabase';

/** Only rendered for the platform owner; RPCs also enforce this on the server. */
export function QontoAdminPanel() {
  const [requests, setRequests] = useState<BillingRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<BillingRequest | null>(null);
  const [url, setUrl] = useState('');
  const [reference, setReference] = useState('');
  const [paidUntil, setPaidUntil] = useState('');
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    const [{ data, error: loadError }, portfolio] = await Promise.all([
      supabase
        .from('billing_requests')
        .select('*')
        .in('status', ['requested', 'awaiting_payment'])
        .order('created_at')
        .limit(100),
      supabase.rpc('superadmin_organizations'),
    ]);
    setError(Boolean(loadError));
    setRequests(data ?? []);
    setNames(
      Object.fromEntries(
        (portfolio.data ?? []).map((org: { id: string; name: string }) => [
          org.id,
          org.name,
        ]),
      ),
    );
  }, []);
  useEffect(() => {
    refresh().catch(() => setError(true));
  }, [refresh]);
  const save = async (confirm: boolean) => {
    if (!selected) return;
    if (confirm && !invoicePeriodEnd(paidUntil)) {
      Alert.alert(
        'Date requise',
        'Indiquez la fin de la période réellement réglée (AAAA-MM-JJ).',
      );
      return;
    }
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
  };
  return (
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
        onPress={() => Linking.openURL('https://app.qonto.com/')}
      >
        <Text style={{ color: '#2563EB', paddingVertical: 12 }}>
          Ouvrir Qonto
        </Text>
      </TouchableOpacity>
      {error && (
        <Text>
          Le raccordement de la facturation est en attente. Les abonnements ne
          sont pas activés automatiquement.
        </Text>
      )}
      {!error && requests.length === 0 && (
        <Text>Aucune demande en attente.</Text>
      )}
      {requests.map((request) => (
        <TouchableOpacity
          key={request.id}
          onPress={() => {
            setSelected(request);
            setUrl(request.payment_url ?? '');
            setReference(request.qonto_reference ?? '');
            setPaidUntil(request.paid_until?.slice(0, 10) ?? '');
          }}
          style={{ paddingVertical: 12 }}
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
      {selected && (
        <View style={{ gap: 12 }}>
          {selected.payment_provider !== 'mollie' && (
            <TextInput
              accessibilityLabel="Lien de paiement Qonto"
              placeholder="Lien de paiement Qonto"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              style={{ backgroundColor: 'white', padding: 12 }}
            />
          )}
          <TextInput
            accessibilityLabel="Référence de facture Qonto"
            placeholder="Référence de facture Qonto"
            value={reference}
            onChangeText={setReference}
            style={{ backgroundColor: 'white', padding: 12 }}
          />
          {selected.payment_provider !== 'mollie' && (
            <TouchableOpacity onPress={() => save(false)}>
              <Text style={{ color: '#2563EB' }}>
                Enregistrer le lien Qonto
              </Text>
            </TouchableOpacity>
          )}
          <TextInput
            accessibilityLabel="Fin de période réglée"
            placeholder="Fin de période réglée (AAAA-MM-JJ)"
            value={paidUntil}
            onChangeText={setPaidUntil}
            style={{ backgroundColor: 'white', padding: 12 }}
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
          {selected.payment_provider !== 'mollie' && (
            <TouchableOpacity
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
  );
}
