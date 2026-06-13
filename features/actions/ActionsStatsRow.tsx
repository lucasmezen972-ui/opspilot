import {
  Clock,
  TriangleAlert as AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

interface ActionsStatsRowProps {
  open: number;
  inProgress: number;
  overdue: number;
}

/** Compteurs d'actions correctives : à traiter, en cours, en retard. */
export function ActionsStatsRow({
  open,
  inProgress,
  overdue,
}: ActionsStatsRowProps) {
  return (
    <View style={styles.row} testID="actions-counters">
      <View style={styles.card}>
        <Clock size={18} color="#F59E0B" />
        <Text style={styles.value} testID="actions-count-open">
          {open}
        </Text>
        <Text style={styles.label}>À traiter</Text>
      </View>
      <View style={styles.card}>
        <ChevronRight size={18} color="#2563EB" />
        <Text style={styles.value} testID="actions-count-inprogress">
          {inProgress}
        </Text>
        <Text style={styles.label}>En cours</Text>
      </View>
      <View style={[styles.card, overdue > 0 && styles.cardAlert]}>
        <AlertTriangle size={18} color="#DC2626" />
        <Text
          style={[styles.value, styles.valueAlert]}
          testID="actions-count-overdue"
        >
          {overdue}
        </Text>
        <Text style={styles.label}>En retard</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardAlert: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  valueAlert: {
    color: '#DC2626',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
});
