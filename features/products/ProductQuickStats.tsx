import {
  TriangleAlert as AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import type { StockCounts } from './productModel';

interface ProductQuickStatsProps {
  counts: StockCounts;
}

/** Bandeau de compteurs de stock : en stock, stock faible, ruptures. */
export function ProductQuickStats({ counts }: ProductQuickStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <TrendingUp size={20} color="#10B981" />
        <Text style={styles.number} testID="products-count-ok">
          {counts.ok}
        </Text>
        <Text style={styles.label}>En stock</Text>
      </View>
      <View style={styles.item}>
        <AlertTriangle size={20} color="#F59E0B" />
        <Text style={styles.number} testID="products-count-low">
          {counts.low}
        </Text>
        <Text style={styles.label}>Stock faible</Text>
      </View>
      <View style={styles.item}>
        <TrendingDown size={20} color="#EF4444" />
        <Text style={styles.number} testID="products-count-out">
          {counts.out}
        </Text>
        <Text style={styles.label}>Ruptures</Text>
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
    gap: 16,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  number: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
});
