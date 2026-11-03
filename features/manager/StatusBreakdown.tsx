import { View, Text, StyleSheet } from 'react-native';

import { colors, shadow } from '../../shared/styles/tokens';

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
    color: colors.textStrong,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 4,
  },
  count: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textStrong,
  },
});
