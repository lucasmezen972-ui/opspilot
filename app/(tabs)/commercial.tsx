import {
  CheckCircle2,
  Mail,
  Rocket,
  ShieldCheck,
  Store,
} from 'lucide-react-native';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  buildCommercialMailto,
  COMMERCIAL_KPIS,
  COMMERCIAL_PLANS,
  SALES_STEPS,
  type CommercialPlan,
} from '../../features/commercial/commercialModel';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, shadow, spacing } from '../../shared/styles/tokens';

export default function CommercialScreen() {
  const openDemoRequest = (planId?: CommercialPlan['id']) => {
    void Linking.openURL(buildCommercialMailto(planId));
  };

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Offre commerciale"
        titleTestID="page-commercial-title"
        subtitle="Transformer la démo OpsPilot en vente client"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Rocket size={24} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>
            OpsPilot aide les magasins à prouver leur conformité, pas seulement à
            la déclarer.
          </Text>
          <Text style={styles.heroText}>
            Audits contextualisés, plans d’action avec preuves, formations
            longues et back-office multi-sites : le parcours est prêt pour une
            démonstration commerciale sérieuse.
          </Text>
          <TouchableOpacity
            testID="commercial-main-cta"
            style={styles.primaryCta}
            onPress={() => openDemoRequest()}
          >
            <Mail size={18} color="#FFFFFF" />
            <Text style={styles.primaryCtaText}>Planifier une démo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.kpiRow}>
          {COMMERCIAL_KPIS.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiDetail}>{kpi.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppSectionHeader title="Offres vendables" />
          {COMMERCIAL_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => openDemoRequest(plan.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <AppSectionHeader title="Tunnel de conversion" />
          <View style={styles.stepsCard}>
            {SALES_STEPS.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.proofCard}>
          <ShieldCheck size={22} color={colors.successText} />
          <View style={styles.proofBody}>
            <Text style={styles.proofTitle}>Promesse commerciale claire</Text>
            <Text style={styles.proofText}>
              Aucun faux bouton de paiement : la conversion passe par une
              demande de démo ou de devis à contact@tradikom.com tant que
              l’activation Stripe/back-end n’est pas contractualisée.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PlanCard({
  plan,
  onPress,
}: {
  plan: CommercialPlan;
  onPress: () => void;
}) {
  const isFeatured = plan.id === 'pro';
  return (
    <View
      style={[styles.planCard, isFeatured ? styles.planCardFeatured : null]}
      testID={`commercial-plan-${plan.id}`}
    >
      <View style={styles.planHeader}>
        <View style={styles.planIcon}>
          <Store size={18} color={colors.primary} />
        </View>
        <View style={styles.planTitleBlock}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planTarget}>{plan.target}</Text>
        </View>
        {isFeatured ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Recommandé</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.price}>{plan.price}</Text>
      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.listBlock}>
        {plan.limits.map((limit) => (
          <View key={limit} style={styles.listRow}>
            <CheckCircle2 size={14} color={colors.successText} />
            <Text style={styles.listText}>{limit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.highlightBlock}>
        {plan.highlights.map((highlight) => (
          <Text key={highlight} style={styles.highlightText}>
            • {highlight}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        testID={`commercial-plan-cta-${plan.id}`}
        style={[styles.planCta, isFeatured ? styles.planCtaFeatured : null]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.planCtaText,
            isFeatured ? styles.planCtaTextFeatured : null,
          ]}
        >
          {plan.cta}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.xl,
    ...shadow.card,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textStrong,
    letterSpacing: -0.4,
  },
  heroText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  primaryCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textStrong,
    marginTop: 2,
  },
  kpiDetail: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  section: { marginTop: spacing.xl },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  planCardFeatured: { borderColor: colors.primary, ...shadow.cardActive },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleBlock: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '800', color: colors.textStrong },
  planTarget: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, color: colors.primaryDark, fontWeight: '800' },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textStrong,
    marginTop: spacing.md,
  },
  planDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 4,
  },
  listBlock: { marginTop: spacing.md, gap: 7 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listText: { flex: 1, fontSize: 13, color: colors.text },
  highlightBlock: { marginTop: spacing.md, gap: 3 },
  highlightText: { fontSize: 12, color: colors.textMuted },
  planCta: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planCtaFeatured: { backgroundColor: colors.primary },
  planCtaText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  planCtaTextFeatured: { color: '#FFFFFF' },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontWeight: '800', color: colors.primaryDark, fontSize: 12 },
  stepText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  proofCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.successSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  proofBody: { flex: 1 },
  proofTitle: { fontSize: 14, fontWeight: '800', color: colors.textStrong },
  proofText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
    marginTop: 4,
  },
});
