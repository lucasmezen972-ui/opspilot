import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { invoicePeriodEnd, parseInvoiceTotal } from './invoice';
import type { BillingRequest } from '../../hooks/useQontoBilling';
import { supabase } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { ChoiceControl } from '../../shared/components/ChoiceControl';
import { colors } from '../../shared/styles/tokens';

export function SepaQuoteControls({
  request,
  reference,
  paidUntil,
  onSaved,
}: {
  request: BillingRequest;
  reference: string;
  paidUntil: string;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState<1 | 12>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const guard = useRef(false);
  if (
    request.status !== 'requested' ||
    Boolean(request.payment_url) ||
    Boolean(request.mollie_payment_id)
  )
    return null;
  return (
    <View
      style={{
        gap: 12,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ fontWeight: '700', color: colors.textStrong }}>
        Préparer un abonnement SEPA
      </Text>
      <Text style={{ lineHeight: 21, color: colors.text }}>
        La préparation ne déclenche aucun débit. Le représentant client devra
        accepter le calendrier et le mandat chez Mollie. La première période
        doit laisser au moins 14 jours avant la première échéance automatique.
        Une facture préparée pour le SEPA ne peut pas recevoir un second lien
        payable.
      </Text>
      <Text>Total TTC de chaque échéance, repris de la facture Qonto</Text>
      <TextInput
        accessibilityLabel="Montant TTC de chaque échéance SEPA"
        placeholder="Montant en euros"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        style={{
          padding: 12,
          minHeight: 44,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          fontSize: 16,
          color: colors.textStrong,
        }}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([1, 12] as const).map((n) => (
          <ChoiceControl
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ checked: months === n }}
            aria-checked={months === n}
            onPress={() => setMonths(n)}
            style={{
              padding: 12,
              minHeight: 44,
              borderRadius: 8,
              backgroundColor:
                months === n ? colors.primarySoft : colors.background,
            }}
          >
            <Text style={{ color: colors.textStrong }}>
              {n === 1 ? 'Mensuel' : 'Annuel'}
            </Text>
          </ChoiceControl>
        ))}
      </View>
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.dangerStrong }}>
          {error}
        </Text>
      )}
      <AppButton
        variant="secondary"
        label="Préparer le calendrier à faire accepter"
        loading={busy}
        onPress={async () => {
          if (guard.current) return;
          const cents = parseInvoiceTotal(amount),
            until = invoicePeriodEnd(paidUntil);
          if (
            !cents ||
            cents > 100000 ||
            !until ||
            !reference.trim() ||
            Date.parse(until) < Date.now() + 14 * 86400000
          ) {
            setError(
              'Renseignez une facture de 0,50 € à 1 000 € TTC et une première période d’au moins 14 jours.',
            );
            return;
          }
          guard.current = true;
          setBusy(true);
          setError('');
          try {
            const { data, error: issue } = await supabase.functions.invoke(
              'mollie-recurring',
              {
                body: {
                  action: 'quote',
                  request_id: request.id,
                  invoice_reference: reference.trim(),
                  amount_cents: cents,
                  paid_until: until,
                  interval_months: months,
                },
              },
            );
            if (issue || data?.error)
              throw new Error(
                data?.error ??
                  'Le calendrier n’a pas pu être préparé. Vérifiez la facture et les autres règlements existants.',
              );
            await onSaved();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'Préparation impossible.',
            );
          } finally {
            guard.current = false;
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
