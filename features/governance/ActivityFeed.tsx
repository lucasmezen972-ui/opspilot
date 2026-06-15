import {
  ClipboardCheck,
  Wrench,
  GraduationCap,
  Download,
  Activity,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { activityCategoryLabel, sortActivity } from './governanceModel';
import type { ActivityEvent, ActivityEventType } from '../../lib/supabase';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

const ICONS: Record<ActivityEventType, LucideIcon> = {
  audit_completed: ClipboardCheck,
  action_resolved: Wrench,
  training_certified: GraduationCap,
  export: Download,
};

const ACCENTS: Record<ActivityEventType, string> = {
  audit_completed: colors.successText,
  action_resolved: colors.primary,
  training_certified: colors.primary,
  export: colors.textMuted,
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

type Props = {
  events: ActivityEvent[];
  limit?: number;
};

/** Fil d'activité de gouvernance (preuves d'exécution tracées). */
export function ActivityFeed({ events, limit = 8 }: Props) {
  const sorted = sortActivity(events).slice(0, limit);

  return (
    <View style={styles.wrap} testID="activity-feed">
      <AppSectionHeader title="Journal d’activité" />
      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Activity size={20} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            Les actions tracées apparaîtront ici.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sorted.map((event) => {
            const Icon = ICONS[event.action] ?? Activity;
            const accent = ACCENTS[event.action] ?? colors.textMuted;
            return (
              <View
                key={event.id}
                style={styles.row}
                testID={`activity-${event.id}`}
              >
                <View
                  style={[styles.iconWrap, { backgroundColor: `${accent}1A` }]}
                >
                  <Icon size={16} color={accent} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.label}>{event.label}</Text>
                  <Text style={styles.meta}>
                    {activityCategoryLabel(event.action)}
                    {event.actor_name ? ` · ${event.actor_name}` : ''}
                    {` · ${formatWhen(event.created_at)}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
