import { Store as StoreIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { getScoreChip, type StorePerformance } from './managerModel';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface StorePerformanceListProps {
  stores: StorePerformance[];
}

/** Performance par magasin : audits terminés et score moyen. */
export function StorePerformanceList({ stores }: StorePerformanceListProps) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Par magasin
      </Text>
      <View style={styles.list}>
        {stores.map(({ store, total, completed, avg }, index) => {
          const chip = getScoreChip(avg);
          return (
            <View
              key={store.id}
              style={[
                styles.row,
                index === stores.length - 1 && styles.rowLast,
              ]}
            >
              <View style={styles.iconWrapper}>
                <StoreIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{store.name}</Text>
                <Text style={styles.subtitle}>
                  {completed}/{total} audits terminés
                </Text>
              </View>
              <View
                style={[styles.chip, { backgroundColor: chip.backgroundColor }]}
              >
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryInk,
    marginBottom: spacing.md,
  },
  list: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrapper: {
    width: 24,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.primaryInk },
});
