import {
  ChartBar as BarChart3,
  ClipboardCheck,
  TriangleAlert as AlertTriangle,
  Target,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import type { ManagerStats } from './managerModel';

interface ManagerStatCardsProps {
  stats: ManagerStats;
}

/** Vue d'ensemble : audits, score moyen, tâches et tâches urgentes. */
export function ManagerStatCards({ stats }: ManagerStatCardsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: '#EFF6FF' }]}>
            <ClipboardCheck size={20} color="#2563EB" />
          </View>
          <Text style={styles.value}>{stats.totalAudits}</Text>
          <Text style={styles.label}>Audits total</Text>
        </View>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: '#F0FDF4' }]}>
            <Target size={20} color="#10B981" />
          </View>
          <Text style={styles.value}>{stats.avgScore}%</Text>
          <Text style={styles.label}>Score moyen</Text>
        </View>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: '#FEF3C7' }]}>
            <BarChart3 size={20} color="#F59E0B" />
          </View>
          <Text style={styles.value}>{stats.totalTasks}</Text>
          <Text style={styles.label}>Tâches total</Text>
        </View>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: '#FEE2E2' }]}>
            <AlertTriangle size={20} color="#EF4444" />
          </View>
          <Text style={styles.value}>{stats.highPriorityTasks}</Text>
          <Text style={styles.label}>Urgentes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
