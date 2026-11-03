import {
  CircleCheck as CheckCircle,
  Clock,
  TriangleAlert as AlertTriangle,
} from 'lucide-react-native';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

import { formatPlanName, getStatusInfo } from './billingModel';
import { colors, shadow } from '../../shared/styles/tokens';

interface CurrentPlanCardProps {
  currentPlan: string;
  status: string;
  trialDaysLeft: number | null;
  currentPeriodEnd?: string | null;
}

/** Bandeau du plan en cours : nom, statut, compte à rebours d'essai. */
export function CurrentPlanCard({
  currentPlan,
  status,
  trialDaysLeft,
  currentPeriodEnd,
}: CurrentPlanCardProps) {
  const { width } = useWindowDimensions();
  const statusInfo = getStatusInfo(status);

  return (
    <View style={[styles.card, width < 420 && styles.cardCompact]}>
      <View style={styles.left}>
        <Text style={styles.label}>Plan actuel</Text>
        <Text accessibilityRole="header" style={styles.name}>
          {formatPlanName(currentPlan)}
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
        <View style={styles.countdown}>
          {trialDaysLeft > 0 ? (
            <>
              <Clock size={20} color={colors.warningText} />
              <Text style={styles.trialDays}>{trialDaysLeft}</Text>
              <Text style={styles.trialDaysLabel}>
                {trialDaysLeft === 1 ? 'jour restant' : 'jours restants'}
              </Text>
            </>
          ) : (
            <>
              <AlertTriangle size={20} color={colors.dangerStrong} />
              <Text style={[styles.trialDays, styles.trialExpired]}>
                Expiré
              </Text>
            </>
          )}
        </View>
      )}
      {currentPeriodEnd && status === 'active' && (
        <View style={styles.countdown}>
          <CheckCircle size={18} color={colors.trustGreen} />
          <Text style={styles.renewDate}>
            Accès réglé jusqu’au{'\n'}
            {new Date(currentPeriodEnd).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  cardCompact: { flexWrap: 'wrap', gap: 20 },
  left: { flex: 1, minWidth: 140 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  name: {
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
  countdown: { alignItems: 'center', gap: 4 },
  trialDays: { fontSize: 28, fontWeight: '700', color: colors.warningText },
  trialExpired: { color: colors.dangerStrong },
  trialDaysLabel: { fontSize: 13, color: colors.textMuted },
  renewDate: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
