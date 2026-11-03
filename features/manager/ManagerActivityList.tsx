import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../shared/styles/tokens';

export interface ActivityItem {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}

interface ManagerActivityListProps {
  title: string;
  items: ActivityItem[];
  last?: boolean;
}

/** Liste d'activité générique (tâches urgentes, audits récents). */
export function ManagerActivityList({
  title,
  items,
  last,
}: ManagerActivityListProps) {
  return (
    <View style={[styles.section, last && styles.sectionLast]}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.item, index === items.length - 1 && styles.itemLast]}
          >
            <View style={styles.left}>
              <View style={styles.icon}>{item.icon}</View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLast: {
    marginBottom: 0,
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemLast: { borderBottomWidth: 0 },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: { width: 24, alignItems: 'center', paddingTop: 2 },
  info: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
