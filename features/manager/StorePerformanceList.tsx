import { Store as StoreIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { getScoreChip, type StorePerformance } from './managerModel';
import { shadow } from '../../shared/styles/tokens';

interface StorePerformanceListProps {
  stores: StorePerformance[];
}

/** Performance par magasin : audits terminés et score moyen. */
export function StorePerformanceList({ stores }: StorePerformanceListProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Par magasin</Text>
      {stores.map(({ store, total, completed, avg }) => {
        const chip = getScoreChip(avg);
        return (
          <View key={store.id} style={styles.row}>
            <View style={styles.iconWrapper}>
              <StoreIcon size={16} color="#2563EB" />
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
              <Text style={[styles.chipText, { color: chip.color }]}>
                {chip.label}
              </Text>
            </View>
          </View>
        );
      })}
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    ...shadow.card,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: { fontSize: 14, fontWeight: '700' },
});
