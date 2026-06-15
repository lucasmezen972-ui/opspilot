import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../styles/tokens';

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Couleur d'accent du marqueur (sinon bleu marque). */
  accent?: string;
  testID?: string;
}

interface AppTimelineProps {
  items: TimelineItem[];
  testID?: string;
}

/** Frise verticale d'événements : marqueur coloré + ligne de liaison. */
export function AppTimeline({ items, testID }: AppTimelineProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      {items.map((item, index) => {
        const accent = item.accent ?? colors.primary;
        const Icon = item.icon;
        const isLast = index === items.length - 1;
        return (
          <View key={item.id} style={styles.row} testID={item.testID}>
            <View style={styles.gutter}>
              <View style={[styles.dot, { backgroundColor: `${accent}1A` }]}>
                {Icon ? (
                  <Icon size={14} color={accent} />
                ) : (
                  <View style={[styles.dotCore, { backgroundColor: accent }]} />
                )}
              </View>
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={[styles.body, isLast && styles.bodyLast]}>
              <Text style={styles.title}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gutter: {
    alignItems: 'center',
    width: 28,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  bodyLast: {
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
