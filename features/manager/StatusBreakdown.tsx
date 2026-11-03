import { View, Text, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../shared/styles/tokens';

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
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.row}>
        {entries.map((entry) => (
          <View key={entry.label} style={styles.item}>
            <Text style={styles.count}>{entry.count}</Text>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: entry.color }]} />
              <Text style={styles.label}>{entry.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryInk,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1,
    color: colors.textMuted,
  },
  count: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryInk,
  },
});
