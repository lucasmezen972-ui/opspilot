import { View, Text, StyleSheet } from 'react-native';

import type { AuditCounts } from './auditListModel';

interface AuditQuickStatsProps {
  counts: AuditCounts;
}

/** Bandeau de compteurs d'audits : à faire, en cours, terminés. */
export function AuditQuickStats({ counts }: AuditQuickStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.number}>{counts.pending}</Text>
        <Text style={styles.label}>À faire</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.number}>{counts.inProgress}</Text>
        <Text style={styles.label}>En cours</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.number}>{counts.completed}</Text>
        <Text style={styles.label}>Terminés</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
