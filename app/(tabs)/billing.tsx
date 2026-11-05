import Constants from 'expo-constants';
import { ExternalLink } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';

import RequireRole from '../../components/RequireRole';
import { CurrentPlanCard } from '../../features/billing/CurrentPlanCard';
import { PlanCard } from '../../features/billing/PlanCard';
import { QontoAdminPanel } from '../../features/billing/QontoAdminPanel';
import { SepaAgreementsPanel } from '../../features/billing/SepaAgreementsPanel';
import { PLANS } from '../../features/billing/billingModel';
import { isBillingPaymentUrl } from '../../features/billing/qonto';
import { useAuth } from '../../hooks/useAuth';
import { useQontoBilling } from '../../hooks/useQontoBilling';
import { useSubscription } from '../../hooks/useSubscription';
import { AppButton } from '../../shared/components/AppButton';
import { colors } from '../../shared/styles/tokens';

export default function BillingScreen() {
  return (
    <RequireRole roles={['admin', 'superadmin']}>
      <BillingScreenContent />
    </RequireRole>
  );
}

function BillingScreenContent() {
  const { profile, isDemoMode, session } = useAuth();
  const {
    subscription,
    trialDaysLeft,
    loading,
    error: subscriptionError,
    refetch: refreshSubscription,
  } = useSubscription();
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    requestInvoice,
    refetch: refreshRequests,
  } = useQontoBilling();
  const isLocalDemo = isDemoMode && !session;
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const submitting = useRef(false);

  const currentPlan = subscription?.plan ?? 'trial';
  const status = subscription?.status ?? 'trialing';

  const handleUpgrade = async (planId: string) => {
    if (
      submitting.current ||
      (!isLocalDemo &&
        (requestsLoading ||
          Boolean(requestsError) ||
          Boolean(subscriptionError)))
    )
      return;
    if (isLocalDemo) {
      Alert.alert(
        'Mode démo',
        "La facturation n'est pas disponible en mode démo.",
      );
      return;
    }
    submitting.current = true;
    setPendingPlan(planId);
    try {
      const invoice = await requestInvoice(planId);
      if (isBillingPaymentUrl(invoice) && invoice.payment_url) {
        await Linking.openURL(invoice.payment_url);
      } else {
        Alert.alert(
          'Demande enregistrée',
          'Votre demande de facture Qonto est enregistrée. Votre abonnement sera activé après vérification du règlement.',
        );
      }
    } catch (issue) {
      Alert.alert(
        'Demande non confirmée',
        issue instanceof Error
          ? issue.message
          : 'Réessayez ou contactez contact@tradikom.com.',
      );
    } finally {
      submitting.current = false;
      setPendingPlan(null);
    }
  };

  const handleEnterprise = async () => {
    await Linking.openURL(
      'mailto:contact@tradikom.com?subject=Devis Enterprise OpsPilot',
    );
  };

  const handleManageSubscription = async () => {
    if (isLocalDemo) {
      Alert.alert(
        'Mode démo',
        "La gestion d'abonnement n'est pas disponible en mode démo.",
      );
      return;
    }
    await Linking.openURL(
      'mailto:contact@tradikom.com?subject=Gestion%20abonnement%20OpsPilot%20Qonto',
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement de l'abonnement…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        width: '100%',
        maxWidth: 1040,
        alignSelf: 'center',
      }}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Abonnement
        </Text>
        <Text style={styles.subtitle}>
          {profile?.full_name ?? 'Mon compte'}
        </Text>
      </View>

      {profile?.role === 'superadmin' && (
        <View style={{ padding: 20 }}>
          <QontoAdminPanel />
        </View>
      )}
      {subscriptionError ? (
        <View
          style={[styles.notice, styles.errorNotice]}
          testID="billing-subscription-error"
        >
          <Text accessibilityRole="alert" style={styles.noticeTitle}>
            Abonnement non vérifié
          </Text>
          <Text style={styles.noticeText}>
            Impossible de vérifier votre abonnement. Actualisez les données
            avant de demander une facture.
          </Text>
          <AppButton
            label="Réessayer le chargement de l’abonnement"
            variant="secondary"
            onPress={() => {
              refreshSubscription();
            }}
          />
        </View>
      ) : subscription ? (
        <CurrentPlanCard
          currentPlan={currentPlan}
          status={status}
          trialDaysLeft={trialDaysLeft}
          currentPeriodEnd={subscription?.current_period_end}
        />
      ) : (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Aucun abonnement enregistré pour cette organisation.
          </Text>
        </View>
      )}

      <TouchableOpacity
        testID="manage-subscription-button"
        accessibilityRole="button"
        accessibilityHint="Ouvre votre messagerie pour contacter le service abonnement"
        style={styles.manageButton}
        onPress={handleManageSubscription}
      >
        <ExternalLink size={16} color="#2563EB" />
        <Text style={styles.manageButtonText}>Gérer mon abonnement Qonto</Text>
      </TouchableOpacity>

      {!isLocalDemo && ['essential', 'business'].includes(currentPlan) && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.renewButton}
          accessibilityState={{
            disabled:
              !!pendingPlan ||
              requestsLoading ||
              !!requestsError ||
              !!subscriptionError,
            busy: pendingPlan === currentPlan,
          }}
          disabled={
            !!pendingPlan ||
            requestsLoading ||
            !!requestsError ||
            !!subscriptionError
          }
          onPress={() => handleUpgrade(currentPlan)}
        >
          <Text style={styles.linkText}>
            Demander une facture de renouvellement
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        {profile?.role !== 'superadmin' && (
          <View style={{ marginVertical: 20 }}>
            <SepaAgreementsPanel
              isLocalDemo={isLocalDemo}
              onChanged={async () => {
                await Promise.all([refreshRequests(), refreshSubscription()]);
              }}
            />
          </View>
        )}
        {!isLocalDemo && (
          <View
            style={[styles.invoiceSummary, requestsError && styles.errorNotice]}
            testID="billing-invoice-status"
          >
            <Text accessibilityRole="header" style={styles.noticeTitle}>
              Mes demandes de facture
            </Text>
            {requestsLoading ? (
              <Text accessibilityLiveRegion="polite" style={styles.noticeText}>
                Chargement des demandes…
              </Text>
            ) : requestsError ? (
              <>
                <Text accessibilityRole="alert" style={styles.noticeText}>
                  {requestsError}
                </Text>
                <AppButton
                  label="Réessayer le chargement des factures"
                  variant="secondary"
                  onPress={() => {
                    refreshRequests().catch(() => {});
                  }}
                />
              </>
            ) : !requests.some((request) =>
                ['requested', 'awaiting_payment'].includes(request.status),
              ) ? (
              <Text style={styles.noticeText}>
                Aucune demande de facture en attente.
              </Text>
            ) : (
              <Text style={styles.noticeText}>
                Retrouvez ci-dessous les demandes en cours et leurs liens de
                règlement vérifiés.
              </Text>
            )}
          </View>
        )}
        {requests
          .filter(
            (request) =>
              request.status === 'requested' ||
              request.status === 'awaiting_payment',
          )
          .map((request) => (
            <View key={request.id} style={styles.invoiceSummary}>
              <Text style={styles.noticeText}>
                Facture Qonto — {request.plan} :{' '}
                {request.status === 'requested'
                  ? 'préparation en cours'
                  : 'en attente de règlement'}
              </Text>
              {isBillingPaymentUrl(request) && (
                <TouchableOpacity
                  accessibilityRole="link"
                  style={styles.linkButton}
                  onPress={() => Linking.openURL(request.payment_url!)}
                >
                  <Text style={styles.linkText}>
                    {request.payment_provider === 'mollie'
                      ? 'Régler la facture chez Mollie'
                      : 'Régler sur Qonto'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Choisir un plan
        </Text>
        <Text style={styles.sectionDescription}>
          Votre choix prépare une demande de facture. L’accès est activé après
          vérification du règlement.
        </Text>
        {!isLocalDemo && (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.linkButton}
            onPress={async () => {
              try {
                await Promise.all([refreshRequests(), refreshSubscription()]);
              } catch {
                Alert.alert(
                  'Actualisation impossible',
                  'Réessayez dans quelques instants.',
                );
              }
            }}
          >
            <Text style={styles.linkText}>Actualiser mon règlement</Text>
          </TouchableOpacity>
        )}
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            onEnterprise={handleEnterprise}
            disabled={
              !!pendingPlan ||
              (!isLocalDemo &&
                (requestsLoading || !!requestsError || !!subscriptionError))
            }
            pending={pendingPlan === plan.id}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Facturation avec Qonto. Votre facture précise le montant, les taxes
          applicables et le moyen de règlement. L’activation suit la
          vérification du paiement. Le prélèvement SEPA nécessite un calendrier
          accepté, un mandat valide et l’activation du service par Mollie. Vous
          pouvez arrêter les prochaines échéances depuis ce calendrier.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  notice: {
    margin: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  invoiceSummary: {
    marginBottom: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  errorNotice: {
    backgroundColor: colors.fieldWarm,
    borderColor: colors.fieldBorder,
  },
  noticeTitle: { fontSize: 16, fontWeight: '700', color: colors.textStrong },
  noticeText: { fontSize: 14, lineHeight: 21, color: colors.text },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  header: {
    padding: 20,
    paddingTop: (Constants.statusBarHeight ?? 44) + 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#111827',
  },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  manageButton: {
    marginHorizontal: 20,
    marginTop: -8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  manageButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: { paddingHorizontal: 20 },
  renewButton: {
    marginHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingVertical: 12 },
  linkText: {
    color: colors.primaryDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 8,
  },
  footer: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});
