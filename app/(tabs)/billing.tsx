import { ExternalLink } from 'lucide-react-native';
import {
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
import {
  PLANS,
  buildActivationMailtoUrl,
} from '../../features/billing/billingModel';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

export default function BillingScreen() {
  return (
    <RequireRole roles={['admin', 'superadmin']}>
      <BillingScreenContent />
    </RequireRole>
  );
}

/** Ouvre une demande d'activation pré-remplie (alternative claire au paiement). */
function requestActivation(planId: string) {
  return Linking.openURL(buildActivationMailtoUrl(planId));
}

function BillingScreenContent() {
  const { profile } = useAuth();
  const { subscription, trialDaysLeft } = useSubscription();

  const currentPlan = subscription?.plan ?? 'trial';
  const status = subscription?.status ?? 'trialing';

  // Tente le paiement en ligne (Stripe) si l'instance est configurée ; sinon
  // bascule sur une demande d'activation pré-remplie — jamais un cul-de-sac.
  const handleUpgrade = async (planId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { plan: planId } },
      );
      if (error || !data?.url) {
        await requestActivation(planId);
        return;
      }
      await Linking.openURL(data.url);
    } catch {
      await requestActivation(planId);
    }
  };

  const handleEnterprise = async () => {
    await Linking.openURL(
      'mailto:contact@tradikom.com?subject=Devis Enterprise OpsPilot',
    );
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-customer-portal',
        {
          body: {
            returnUrl: 'https://lucasmezen972-ui.github.io/opspilot/billing',
          },
        },
      );
      if (error || !data?.url) {
        const msg =
          (error as { message?: string })?.message ??
          data?.error ??
          "Portail de facturation indisponible. Souscrivez d'abord à un plan.";
        Alert.alert('Gestion abonnement', msg);
        return;
      }
      await Linking.openURL(data.url);
    } catch {
      Alert.alert(
        'Gestion abonnement',
        'Portail de facturation indisponible pour le moment.',
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Abonnement</Text>
        <Text style={styles.subtitle}>
          {profile?.full_name ?? 'Mon compte'}
        </Text>
      </View>

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
        <Text style={styles.manageButtonText}>Gérer mon abonnement</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choisir un plan</Text>
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
          Souscription accompagnée par notre équipe. Le paiement en ligne
          (Stripe) est proposé lorsqu’il est activé sur votre instance ; sinon
          nous finalisons l’activation avec vous. Sans engagement.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 20,
    paddingTop: 60,
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
  footerText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
