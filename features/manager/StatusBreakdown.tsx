import { View, Text, StyleSheet } from 'react-native';

import { shadow } from '../../shared/styles/tokens';

export interface StatusEntry {
  label: string;
  count: number;
  color: string;
}

interface StatusBreakdownProps {
  title: string;
  entries: StatusEntry[];
}

/** Répartition par statut : pastille colorée, libellé et compteur. */
export function StatusBreakdown({ title, entries }: StatusBreakdownProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.row}>
        {entries.map((entry) => (
          <View key={entry.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: entry.color }]} />
            <Text style={styles.label}>{entry.label}</Text>
            <Text style={styles.count}>{entry.count}</Text>
          </View>
        ))}
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
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...shadow.card,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  count: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});
