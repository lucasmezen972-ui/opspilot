import { router } from 'expo-router';
import { Package, CircleCheck } from 'lucide-react-native';
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { getDlcAlerts, getDlcUrgency } from './dashboardModel';
import type { Product } from '../../lib/supabase';
import {
  AppActionRow,
  AppActionIndicator,
} from '../../shared/components/AppActionRow';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface DashboardDlcAlertsProps {
  products: Product[];
  now: Date;
  embedded?: boolean;
}

/** Section « Alertes DLC » : produits dont la date limite approche. */
export function DashboardDlcAlerts({
  products,
  now,
  embedded = false,
}: DashboardDlcAlertsProps) {
  const alerts = useMemo(() => getDlcAlerts(products, now), [products, now]);
  if (alerts.length === 0 && !embedded) return null;

  return (
    <View style={[styles.section, embedded && styles.embedded]}>
      <View style={embedded && styles.heading}>
        <AppSectionHeader
          title="Alertes DLC"
          actionLabel="Voir tout →"
          onAction={() => router.push('/products')}
        />
      </View>
      <View
        style={[styles.card, embedded && styles.embeddedList]}
        testID={alerts.length > 0 ? 'dlc-alerts' : undefined}
      >
        {alerts.map((product) => {
          const urgency = getDlcUrgency(product.dlc!, now);
          return (
            <AppActionRow
              key={product.id}
              testID={`dlc-alert-${product.id}`}
              style={styles.item}
              href="/products"
              accessibilityRole="link"
              accessibilityLabel={`${product.name}, ${urgency.label}. Ouvrir les produits`}
            >
              <View style={styles.icon}>
                <Package size={17} color={colors.textMuted} />
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {product.name}
              </Text>
              <View
                style={[styles.badge, { backgroundColor: urgency.badgeBg }]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: urgency.isExpired
                        ? colors.dangerStrong
                        : colors.text,
                    },
                  ]}
                >
                  {urgency.label}
                </Text>
              </View>
              <AppActionIndicator />
            </AppActionRow>
          );
        })}
        {alerts.length === 0 && (
          <View style={styles.empty}>
            <CircleCheck size={22} color={colors.trustGreen} />
            <Text style={styles.emptyTitle}>Aucune échéance proche</Text>
            <Text style={styles.emptyText}>
              Aucun produit signalé dans les sept prochains jours.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  embedded: {
    flex: 1,
    padding: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  heading: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 8,
    gap: 8,
  },
  embeddedList: {
    borderWidth: 0,
    borderRadius: 0,
  },
  item: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  icon: {
    width: 20,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    color: colors.textStrong,
    fontWeight: '600',
  },
  empty: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 36,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryInk,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
