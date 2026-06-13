import { View, Text, StyleSheet } from 'react-native';

import type { TaskStats } from './taskModel';
import { colors } from '../../shared/styles/tokens';

interface TaskQuickStatsProps {
  stats: TaskStats;
}

/** Bandeau de compteurs : tâches à faire, en cours, terminées. */
export function TaskQuickStats({ stats }: TaskQuickStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.number}>{stats.pending}</Text>
        <Text style={styles.label}>À faire</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.number}>{stats.inProgress}</Text>
        <Text style={styles.label}>En cours</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.number}>{stats.completed}</Text>
        <Text style={styles.label}>Terminées</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textStrong,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
