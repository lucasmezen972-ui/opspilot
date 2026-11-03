import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { invoicePeriodEnd, parseInvoiceTotal } from './invoice';
import type { BillingRequest } from '../../hooks/useQontoBilling';
import { supabase } from '../../lib/supabase';
import { colors, radius } from '../../shared/styles/tokens';

interface Props {
  request: BillingRequest;
  reference: string;
  paidUntil: string;
  onSaved: () => Promise<void>;
}

export function MolliePaymentControls({
  request,
  reference,
  paidUntil,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState(
    request.amount_cents ? (request.amount_cents / 100).toFixed(2) : '',
  );
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const refreshStatus = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('mollie-billing', {
      body: { action: 'status' },
    });
    setReady(error || !data?.configured ? null : data.ready === true);
  }, []);
  useEffect(() => {
    refreshStatus().catch(() => setReady(null));
  }, [refreshStatus]);

  const perform = async (refresh: boolean) => {
    const amountCents = parseInvoiceTotal(amount);
    const periodEnd = invoicePeriodEnd(paidUntil);
    if (!refresh && (!amountCents || !periodEnd || !reference.trim())) {
      Alert.alert(
        'Facture requise',
        'Renseignez la référence Qonto, le montant TTC exact et la fin de la période facturée.',
      );
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'mollie-billing',
        {
          body: refresh
            ? { action: 'refresh', payment_id: request.mollie_payment_id }
            : {
                action: 'create',
                request_id: request.id,
                invoice_reference: reference.trim(),
                amount_cents: amountCents,
                paid_until: periodEnd,
              },
        },
      );
      if (error || data?.error)
        throw new Error(
          'Le paiement n’a pas pu être préparé ou vérifié. Vérifiez la validation Mollie et les informations de la facture. Réessayez avec les mêmes informations.',
        );
      Alert.alert(
        refresh ? 'Paiement vérifié' : 'Lien prêt',
        refresh
          ? 'Le statut a été relu auprès de Mollie.'
          : 'Le client peut maintenant régler cette facture depuis son abonnement.',
      );
      await onSaved();
    } catch (error) {
      Alert.alert(
        'Paiement indisponible',
        error instanceof Error ? error.message : 'Réessayez plus tard.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 12, paddingVertical: 12 }}>
      <Text style={{ fontWeight: '600' }}>Paiement par carte avec Mollie</Text>
      <Text>
        {ready === true
          ? 'Compte disponible pour les paiements.'
          : ready === false
            ? 'Mollie vérifie encore le compte. La création de paiements réels reste bloquée.'
            : 'Vérification du service de paiement indisponible.'}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        style={{ minHeight: 44, justifyContent: 'center' }}
        onPress={() => refreshStatus().catch(() => setReady(null))}
      >
        <Text style={{ color: '#2563EB' }}>Actualiser l’état de Mollie</Text>
      </TouchableOpacity>
      {!request.mollie_payment_id && (
        <>
          <Text>
            Créez d’abord la facture dans Qonto. Saisissez son total TTC, sans
            recalculer les taxes ici.
          </Text>
          <Text style={{ fontWeight: '600', color: colors.textStrong }}>
            Montant total TTC de la facture (€)
          </Text>
          <TextInput
            accessibilityLabel="Montant total TTC de la facture"
            placeholder="Total TTC en euros"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.surface,
              padding: 12,
              minHeight: 48,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sm,
              color: colors.textStrong,
              fontSize: 16,
            }}
          />
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy || ready !== true}
            accessibilityState={{ disabled: busy || ready !== true, busy }}
            onPress={() => perform(false)}
            style={{
              opacity: busy || ready !== true ? 0.5 : 1,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#2563EB' }}>
              {busy
                ? 'Préparation…'
                : 'Créer le lien de règlement de cette facture'}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {request.mollie_payment_id && (
        <TouchableOpacity
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center' }}
          disabled={busy}
          accessibilityState={{ disabled: busy, busy }}
          onPress={() => perform(true)}
        >
          <Text style={{ color: '#2563EB' }}>
            {busy ? 'Vérification…' : 'Revérifier ce paiement auprès de Mollie'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
