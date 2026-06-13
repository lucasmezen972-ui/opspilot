import { router } from 'expo-router';
import { Package, Calendar } from 'lucide-react-native';
import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { getDlcAlerts, getDlcUrgency } from './dashboardModel';
import type { Product } from '../../lib/supabase';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

interface DashboardDlcAlertsProps {
  products: Product[];
  now: Date;
}

/** Section « Alertes DLC » : produits dont la date limite approche. */
export function DashboardDlcAlerts({ products, now }: DashboardDlcAlertsProps) {
  const alerts = useMemo(() => getDlcAlerts(products, now), [products, now]);
  if (alerts.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppSectionHeader
        title="Alertes DLC"
        actionLabel="Voir tout →"
        onAction={() => router.push('/products')}
      />
      <View style={styles.card} testID="dlc-alerts">
        {alerts.map((product, idx) => {
          const urgency = getDlcUrgency(product.dlc!, now);
          return (
            <TouchableOpacity
              key={product.id}
              testID={`dlc-alert-${product.id}`}
              style={[
                styles.item,
                idx < alerts.length - 1 && styles.itemBorder,
              ]}
              onPress={() => router.push('/products')}
            >
              <View style={[styles.icon, { backgroundColor: urgency.iconBg }]}>
                <Package size={14} color={urgency.color} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {product.name}
              </Text>
              <View
                style={[styles.badge, { backgroundColor: urgency.badgeBg }]}
              >
                <Calendar size={11} color={urgency.color} />
                <Text style={[styles.badgeText, { color: urgency.color }]}>
                  {urgency.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    gap: spacing.sm + 2,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textStrong,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
