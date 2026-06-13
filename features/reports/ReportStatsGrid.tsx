import { View, Text, StyleSheet } from 'react-native';

import type { ReportStat } from './reportsModel';

interface ReportStatsGridProps {
  stats: ReportStat[];
}

/** Grille de synthèse : six indicateurs de conformité et d'activité. */
export function ReportStatsGrid({ stats }: ReportStatsGridProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Synthèse</Text>
      <View style={styles.grid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <View key={stat.label} style={styles.card}>
              <Icon size={18} color={stat.color} />
              <Text style={[styles.value, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.label}>{stat.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    paddingBottom: 0,
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
    gap: 10,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
  },
});
