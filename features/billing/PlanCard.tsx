import { CircleCheck as CheckCircle, ExternalLink } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { getPlanState, type Plan } from './billingModel';
import { shadow } from '../../shared/styles/tokens';

interface PlanCardProps {
  plan: Plan;
  currentPlan: string;
  onUpgrade: (planId: string) => void;
  onEnterprise: () => void;
}

/** Carte d'un plan : titre, prix, fonctionnalités et bouton d'action. */
export function PlanCard({
  plan,
  currentPlan,
  onUpgrade,
  onEnterprise,
}: PlanCardProps) {
  const Icon = plan.icon;
  const { isCurrent, isDowngrade } = getPlanState(plan.id, currentPlan);

  return (
    <View style={[styles.card, isCurrent && styles.cardCurrent]}>
      {plan.badge && (
        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
          <Text style={styles.popularBadgeText}>{plan.badge}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: plan.bg }]}>
          <Icon size={22} color={plan.color} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.description}>{plan.description}</Text>
        </View>
        <View style={styles.priceBlock}>
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
          onPress={() => onUpgrade(plan.id)}
        >
          <Text
            style={[
              styles.upgradeButtonText,
              isDowngrade ? styles.downgradeText : styles.upgradeText,
            ]}
          >
            {isDowngrade ? 'Rétrograder' : `Passer à ${plan.name}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  description: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  priceBlock: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '700' },
  period: { fontSize: 12, color: '#6B7280' },
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
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  currentBadgeText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
});
