import {
  ChartBar as BarChart3,
  ClipboardCheck,
  TriangleAlert as AlertTriangle,
  Target,
} from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

import type { ManagerStats } from './managerModel';
import { AppKpiCard } from '../../shared/components/AppKpiCard';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, spacing } from '../../shared/styles/tokens';
import { DashboardGrid } from '../dashboard/DashboardGrid';

interface ManagerStatCardsProps {
  stats: ManagerStats;
}

/** Vue d'ensemble : audits, score moyen, tâches et tâches urgentes. */
export function ManagerStatCards({ stats }: ManagerStatCardsProps) {
  return (
    <View style={styles.section}>
      <AppSectionHeader title="Vue d'ensemble" />
      <DashboardGrid minItemWidth={175} columnOptions={[2, 4]}>
        <AppKpiCard
          style={styles.card}
          icon={ClipboardCheck}
          value={stats.totalAudits}
          label="Audits au total"
          accent={colors.primary}
          accentSoft={colors.primarySoft}
        />
        <AppKpiCard
          style={styles.card}
          icon={Target}
          value={`${stats.avgScore}%`}
          label="Score moyen"
          accent={colors.trustGreen}
          accentSoft={colors.successSoft}
        />
        <AppKpiCard
          style={styles.card}
          icon={BarChart3}
          value={stats.totalTasks}
          label="Tâches au total"
          accent={colors.primary}
          accentSoft={colors.primarySoft}
        />
        <AppKpiCard
          style={styles.card}
          icon={AlertTriangle}
          value={stats.highPriorityTasks}
          label="Tâches urgentes"
          accent={colors.dangerStrong}
          accentSoft={colors.dangerSoft}
        />
      </DashboardGrid>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  card: {
    width: '100%',
    minHeight: 144,
    flex: 1,
  },
});
