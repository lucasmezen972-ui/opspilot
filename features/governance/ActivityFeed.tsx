import {
  ClipboardCheck,
  Wrench,
  GraduationCap,
  Download,
  Activity,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import {
  activityCategoryLabel,
  filterActivity,
  sortActivity,
  type ActivityFilter,
} from './governanceModel';
import type { ActivityEvent, ActivityEventType } from '../../lib/supabase';
import { AppCard } from '../../shared/components/AppCard';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import {
  AppTimeline,
  type TimelineItem,
} from '../../shared/components/AppTimeline';
import { colors, radius, spacing } from '../../shared/styles/tokens';

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'audit_completed', label: 'Audits' },
  { key: 'action_resolved', label: 'Actions' },
  { key: 'training_certified', label: 'Formations' },
  { key: 'export', label: 'Exports' },
];

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
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const sorted = sortActivity(filterActivity(events, filter)).slice(0, limit);

  const timelineItems: TimelineItem[] = sorted.map((event) => ({
    id: event.id,
    testID: `activity-${event.id}`,
    title: event.label,
    subtitle: `${activityCategoryLabel(event.action)}${
      event.actor_name ? ` · ${event.actor_name}` : ''
    } · ${formatWhen(event.created_at)}`,
    icon: ICONS[event.action] ?? Activity,
    accent: ACCENTS[event.action] ?? colors.textMuted,
  }));

  return (
    <View style={styles.wrap} testID="activity-feed">
      <AppSectionHeader title="Journal d’activité" />
      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = item.key === filter;
          return (
            <TouchableOpacity
              key={item.key}
              testID={`activity-filter-${item.key}`}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Activity size={20} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'Les actions tracées apparaîtront ici.'
              : 'Aucune action tracée pour ce filtre.'}
          </Text>
        </View>
      ) : (
        <AppCard style={styles.card}>
          <AppTimeline items={timelineItems} />
        </AppCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
  },
  card: {
    paddingVertical: spacing.sm,
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
