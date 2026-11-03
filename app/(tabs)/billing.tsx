import Constants from 'expo-constants';
import { ExternalLink } from 'lucide-react-native';
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
    refetch: refreshSubscription,
  } = useSubscription();
  const {
    requests,
    requestInvoice,
    refetch: refreshRequests,
  } = useQontoBilling();
  const isLocalDemo = isDemoMode && !session;

  const currentPlan = subscription?.plan ?? 'trial';
  const status = subscription?.status ?? 'trialing';

  const handleUpgrade = async (planId: string) => {
    if (isLocalDemo) {
      Alert.alert(
        'Mode démo',
        "La facturation n'est pas disponible en mode démo.",
      );
      return;
    }
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
    } catch {
      Alert.alert(
        'Demande impossible',
        'Réessayez ou contactez contact@tradikom.com.',
      );
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
        <Text style={styles.title}>Abonnement</Text>
        <Text style={styles.subtitle}>
          {profile?.full_name ?? 'Mon compte'}
        </Text>
      </View>

      {profile?.role === 'superadmin' && (
        <View style={{ padding: 20 }}>
          <QontoAdminPanel />
        </View>
      )}
      <CurrentPlanCard
        currentPlan={currentPlan}
        status={status}
        trialDaysLeft={trialDaysLeft}
        currentPeriodEnd={subscription?.current_period_end}
      />

      <TouchableOpacity
        testID="manage-subscription-button"
        style={styles.manageButton}
        onPress={handleManageSubscription}
      >
        <ExternalLink size={16} color="#2563EB" />
        <Text style={styles.manageButtonText}>Gérer mon abonnement Qonto</Text>
      </TouchableOpacity>

      {!isLocalDemo && ['essential', 'business'].includes(currentPlan) && (
        <TouchableOpacity onPress={() => handleUpgrade(currentPlan)}>
          <Text style={{ color: '#2563EB', padding: 20 }}>
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
        {requests
          .filter(
            (request) =>
              request.status === 'requested' ||
              request.status === 'awaiting_payment',
          )
          .map((request) => (
            <View key={request.id} style={{ marginBottom: 16 }}>
              <Text>
                Facture Qonto — {request.plan} :{' '}
                {request.status === 'requested'
                  ? 'préparation en cours'
                  : 'en attente de règlement'}
              </Text>
              {isBillingPaymentUrl(request) && (
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(request.payment_url!)}
                >
                  <Text style={{ color: '#2563EB', paddingVertical: 12 }}>
                    {request.payment_provider === 'mollie'
                      ? 'Régler la facture chez Mollie'
                      : 'Régler sur Qonto'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        <Text style={styles.sectionTitle}>Choisir un plan</Text>
        {!isLocalDemo && (
          <TouchableOpacity
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
            <Text style={{ color: '#2563EB', paddingVertical: 12 }}>
              Actualiser mon règlement
            </Text>
          </TouchableOpacity>
        )}
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            onEnterprise={handleEnterprise}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Facturation mensuelle avec Qonto. Votre facture précise le montant,
          les taxes applicables et le moyen de règlement. L’activation suit la
          vérification du paiement. Le prélèvement SEPA nécessite un calendrier
          accepté, un mandat valide et l’activation du service par Mollie. Vous
          pouvez arrêter les prochaines échéances depuis ce calendrier.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  manageButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  footer: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});
