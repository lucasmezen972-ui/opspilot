import type { LucideIcon } from 'lucide-react-native';
import {
  Crown,
  Building2,
  Rocket,
  CircleCheck as CheckCircle,
  Clock,
  TriangleAlert as AlertTriangle,
  ExternalLink,
} from 'lucide-react-native';
import React from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  description: string;
  badge?: string;
  features: readonly string[];
};

const PLANS: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: '299 €',
    period: '/mois',
    icon: Building2,
    color: '#2563EB',
    bg: '#EFF6FF',
    description: '1 magasin · 15 utilisateurs',
    features: [
      'Audits illimités',
      'Contrôle DLC',
      'Actions correctives',
      'Invitations équipe',
      'Export CSV',
      'Support e-mail',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '799 €',
    period: '/mois',
    icon: Rocket,
    color: '#7C3AED',
    bg: '#F5F3FF',
    description: '5 magasins · 75 utilisateurs',
    badge: 'Populaire',
    features: [
      'Tout Essential +',
      'Dashboard multi-sites',
      'Bibliothèque de modèles avancés',
      'Rapports PDF/Excel',
      'API webhooks',
      'Support prioritaire',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sur devis',
    period: '',
    icon: Crown,
    color: '#D97706',
    bg: '#FFFBEB',
    description: 'Illimité · SSO · Marque blanche',
    features: [
      'Tout Business +',
      'Magasins & utilisateurs illimités',
      'SSO (SAML / OAuth)',
      'SLA garanti 99,9 %',
      'Compte manager dédié',
      'Déploiement on-premise possible',
    ],
  },
];

const DEFAULT_STATUS = { label: 'Essai gratuit', color: '#2563EB' };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: 'Essai gratuit', color: '#2563EB' },
  active: { label: 'Actif', color: '#16A34A' },
  past_due: { label: 'Paiement en retard', color: '#DC2626' },
  canceled: { label: 'Annulé', color: '#6B7280' },
};

const PLAN_ORDER = { trial: 0, essential: 1, business: 2, enterprise: 3 };

export default function BillingScreen() {
  return (
    <RequireRole roles={['admin']}>
      <BillingScreenContent />
    </RequireRole>
  );
}

function BillingScreenContent() {
  const { profile } = useAuth();
  const { subscription, trialDaysLeft } = useSubscription();

  const currentPlan = subscription?.plan ?? 'trial';
  const status = subscription?.status ?? 'trialing';
  const statusInfo = STATUS_LABELS[status] ?? DEFAULT_STATUS;

  const handleUpgrade = async (planId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { plan: planId } },
      );
      if (error || !data?.url) {
        Alert.alert(
          'Indisponible',
          "L'intégration Stripe n'est pas encore configurée. Contactez-nous à contact@opspilot.fr pour souscrire.",
        );
        return;
      }
      await Linking.openURL(data.url);
    } catch {
      Alert.alert(
        'Indisponible',
        "L'intégration Stripe n'est pas encore configurée. Contactez-nous à contact@opspilot.fr pour souscrire.",
      );
    }
  };

  const handleEnterprise = async () => {
    await Linking.openURL(
      'mailto:contact@opspilot.fr?subject=Devis Enterprise OpsPilot',
    );
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-customer-portal',
        { body: { returnUrl: 'https://lucasmezen972-ui.github.io/opspilot/billing' } },
      );
      if (error || !data?.url) {
        const msg =
          (error as any)?.message ??
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
          {profile?.full_name || 'Mon compte'}
        </Text>
      </View>

      {/* Current plan banner */}
      <View style={styles.currentPlanCard}>
        <View style={styles.currentPlanLeft}>
          <Text style={styles.currentPlanLabel}>Plan actuel</Text>
          <Text style={styles.currentPlanName}>
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusInfo.color}20` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        {status === 'trialing' && trialDaysLeft !== null && (
          <View style={styles.trialCountdown}>
            {trialDaysLeft > 0 ? (
              <>
                <Clock size={20} color="#F59E0B" />
                <Text style={styles.trialDays}>{trialDaysLeft}</Text>
                <Text style={styles.trialDaysLabel}>jours restants</Text>
              </>
            ) : (
              <>
                <AlertTriangle size={20} color="#EF4444" />
                <Text style={[styles.trialDays, { color: '#EF4444' }]}>
                  Expiré
                </Text>
              </>
            )}
          </View>
        )}
        {subscription?.current_period_end && status === 'active' && (
          <View style={styles.trialCountdown}>
            <CheckCircle size={18} color="#16A34A" />
            <Text style={styles.renewDate}>
              Renouvelle le{'\n'}
              {new Date(subscription.current_period_end).toLocaleDateString(
                'fr-FR',
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Manage subscription (Stripe Billing Portal) */}
      <TouchableOpacity
        testID="manage-subscription-button"
        style={styles.manageButton}
        onPress={handleManageSubscription}
      >
        <ExternalLink size={16} color="#2563EB" />
        <Text style={styles.manageButtonText}>Gérer mon abonnement</Text>
      </TouchableOpacity>

      {/* Plan cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choisir un plan</Text>

        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent =
            currentPlan === plan.id ||
            (currentPlan === 'trial' && plan.id === 'essential');
          const isDowngrade =
            PLAN_ORDER[plan.id as keyof typeof PLAN_ORDER] <
            PLAN_ORDER[currentPlan as keyof typeof PLAN_ORDER];

          return (
            <View
              key={plan.id}
              style={[styles.planCard, isCurrent && styles.planCardCurrent]}
            >
              {plan.badge && (
                <View
                  style={[styles.popularBadge, { backgroundColor: plan.color }]}
                >
                  <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View
                  style={[styles.planIconWrapper, { backgroundColor: plan.bg }]}
                >
                  <Icon size={22} color={plan.color} />
                </View>
                <View style={styles.planTitleBlock}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <View style={styles.planPriceBlock}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>
                    {plan.price}
                  </Text>
                  {!!plan.period && (
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  )}
                </View>
              </View>

              <View style={styles.featuresBlock}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <CheckCircle size={14} color={plan.color} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {plan.id === 'enterprise' ? (
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    { backgroundColor: plan.bg, borderColor: plan.color },
                  ]}
                  onPress={handleEnterprise}
                >
                  <ExternalLink size={15} color={plan.color} />
                  <Text
                    style={[styles.upgradeButtonText, { color: plan.color }]}
                  >
                    Nous contacter
                  </Text>
                </TouchableOpacity>
              ) : isCurrent ? (
                <View style={styles.currentBadgeButton}>
                  <CheckCircle size={15} color="#16A34A" />
                  <Text style={styles.currentBadgeText}>Plan actuel</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    isDowngrade
                      ? styles.downgradeButton
                      : { backgroundColor: plan.color },
                  ]}
                  onPress={() => handleUpgrade(plan.id)}
                >
                  <Text
                    style={[
                      styles.upgradeButtonText,
                      isDowngrade ? { color: '#6B7280' } : { color: '#FFFFFF' },
                    ]}
                  >
                    {isDowngrade ? 'Rétrograder' : 'Passer à ' + plan.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Les paiements sont sécurisés via Stripe. Annulation possible à tout
          moment.
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
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  currentPlanCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
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
  currentPlanLeft: { flex: 1 },
  currentPlanLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  currentPlanName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  trialCountdown: { alignItems: 'center', gap: 4, marginLeft: 16 },
  trialDays: { fontSize: 28, fontWeight: '700', color: '#F59E0B' },
  trialDaysLabel: { fontSize: 11, color: '#6B7280' },
  renewDate: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  planCardCurrent: {
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  popularBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  popularBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  planIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitleBlock: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  planDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  planPriceBlock: { alignItems: 'flex-end' },
  planPrice: { fontSize: 20, fontWeight: '700' },
  planPeriod: { fontSize: 12, color: '#6B7280' },
  featuresBlock: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#374151' },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  upgradeButtonText: { fontSize: 14, fontWeight: '600' },
  downgradeButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  currentBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  currentBadgeText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  footer: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  footerText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
