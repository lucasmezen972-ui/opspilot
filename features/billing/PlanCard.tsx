import { CircleCheck as CheckCircle, ExternalLink } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import { getPlanState, type Plan } from './billingModel';
import { colors, radius, shadow, spacing } from '../../shared/styles/tokens';

interface PlanCardProps {
  plan: Plan;
  currentPlan: string;
  onUpgrade: (planId: string) => void;
  onEnterprise: () => void;
  disabled?: boolean;
  pending?: boolean;
}

/** Carte d'un plan : titre, prix, fonctionnalités et bouton d'action. */
export function PlanCard({
  plan,
  currentPlan,
  onUpgrade,
  onEnterprise,
  disabled = false,
  pending = false,
}: PlanCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const Icon = plan.icon;
  const { isCurrent, isDowngrade } = getPlanState(plan.id, currentPlan);

  return (
    <View style={[styles.card, isCurrent && styles.cardCurrent]}>
      {plan.badge && (
        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
          <Text style={styles.popularBadgeText}>{plan.badge}</Text>
        </View>
      )}

      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={styles.identity}>
          <View style={[styles.iconWrapper, { backgroundColor: plan.bg }]}>
            <Icon size={22} color={plan.color} />
          </View>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.name}>
              {plan.name}
            </Text>
            <Text style={styles.description}>{plan.description}</Text>
          </View>
        </View>
        <View style={[styles.priceBlock, compact && styles.priceBlockCompact]}>
          <Text style={[styles.price, { color: plan.color }]}>
            {plan.price}
          </Text>
          {!!plan.period && <Text style={styles.period}>{plan.period}</Text>}
        </View>
      </View>

      <View style={styles.featuresBlock}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <CheckCircle size={14} color={plan.color} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {plan.id === 'enterprise' ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityHint={`Ouvre votre messagerie pour demander un devis ${plan.name}`}
          style={[
            styles.upgradeButton,
            { backgroundColor: plan.bg, borderColor: plan.color },
          ]}
          onPress={onEnterprise}
        >
          <ExternalLink size={15} color={plan.color} />
          <Text style={[styles.upgradeButtonText, { color: plan.color }]}>
            Nous contacter
          </Text>
        </TouchableOpacity>
      ) : isCurrent ? (
        <View style={styles.currentBadgeButton}>
          <CheckCircle size={15} color={colors.trustGreen} />
          <Text style={styles.currentBadgeText}>Plan actuel</Text>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityHint={`Demande une facture pour le plan ${plan.name}. L’accès est activé après vérification du règlement.`}
          accessibilityState={{ disabled, busy: pending }}
          disabled={disabled}
          style={[
            styles.upgradeButton,
            disabled && { opacity: 0.5 },
            isDowngrade
              ? styles.downgradeButton
              : { backgroundColor: plan.color },
          ]}
          onPress={() => onUpgrade(plan.id)}
        >
          <Text
            style={[
              styles.upgradeButtonText,
              isDowngrade ? styles.downgradeText : styles.upgradeText,
            ]}
          >
            {pending
              ? 'Enregistrement…'
              : isDowngrade
                ? 'Rétrograder'
                : `Passer à ${plan.name}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...shadow.card,
  },
  cardCurrent: {
    borderColor: '#2563EB',
    ...shadow.cardActive,
  },
  popularBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  popularBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: spacing.md,
  },
  headerCompact: { flexDirection: 'column', alignItems: 'stretch' },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  priceBlock: { alignItems: 'flex-end' },
  priceBlockCompact: { alignItems: 'flex-start', marginLeft: 56 },
  price: { fontSize: 24, fontWeight: '700' },
  period: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  featuresBlock: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  upgradeButtonText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
    flexShrink: 1,
  },
  upgradeText: { color: '#FFFFFF' },
  downgradeButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  downgradeText: { color: '#6B7280' },
  currentBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  currentBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.trustGreen,
  },
});
