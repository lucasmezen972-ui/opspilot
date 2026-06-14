import {
  CircleCheck as CheckCircle,
  Clock,
  TriangleAlert as AlertTriangle,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { formatPlanName, getStatusInfo } from './billingModel';
import { shadow } from '../../shared/styles/tokens';

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
  const statusInfo = getStatusInfo(status);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.label}>Plan actuel</Text>
        <Text style={styles.name}>{formatPlanName(currentPlan)}</Text>
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
              <Clock size={20} color="#F59E0B" />
              <Text style={styles.trialDays}>{trialDaysLeft}</Text>
              <Text style={styles.trialDaysLabel}>jours restants</Text>
            </>
          ) : (
            <>
              <AlertTriangle size={20} color="#EF4444" />
              <Text style={[styles.trialDays, styles.trialExpired]}>
                Expiré
              </Text>
            </>
          )}
        </View>
      )}
      {currentPeriodEnd && status === 'active' && (
        <View style={styles.countdown}>
          <CheckCircle size={18} color="#16A34A" />
          <Text style={styles.renewDate}>
            Renouvelle le{'\n'}
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
    ...shadow.card,
  },
  left: { flex: 1 },
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
  countdown: { alignItems: 'center', gap: 4, marginLeft: 16 },
  trialDays: { fontSize: 28, fontWeight: '700', color: '#F59E0B' },
  trialExpired: { color: '#EF4444' },
  trialDaysLabel: { fontSize: 11, color: '#6B7280' },
  renewDate: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
