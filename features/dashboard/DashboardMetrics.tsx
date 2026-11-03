import { View, Text, StyleSheet } from 'react-native';

import { DashboardGrid } from './DashboardGrid';
import type { DashboardKpi } from './dashboardModel';
import { colors, spacing } from '../../shared/styles/tokens';

type Props = {
  kpis: DashboardKpi[];
};

/** Une lecture des volumes, sans transformer chaque chiffre en alerte visuelle. */
export function DashboardMetrics({ kpis }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        Ce qui compte aujourd’hui
      </Text>
      <DashboardGrid columnOptions={[2, 3, 5]} minItemWidth={96}>
        {kpis.map((kpi) => (
          <View key={kpi.id} testID={`kpi-${kpi.id}`} style={styles.metric}>
            <Text testID={`kpi-${kpi.id}-value`} style={styles.value}>
              {kpi.value}
            </Text>
            <Text style={styles.label}>{kpi.label}</Text>
          </View>
        ))}
      </DashboardGrid>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  heading: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.textMuted,
  },
  metric: {
    paddingRight: spacing.sm,
    gap: spacing.xs,
    minHeight: 68,
  },
  value: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    color: colors.primaryInk,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
