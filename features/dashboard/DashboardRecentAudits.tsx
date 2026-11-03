import { router } from 'expo-router';
import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  ChartBar as BarChart3,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import type { Audit } from '../../lib/supabase';
import {
  AppActionRow,
  AppActionIndicator,
} from '../../shared/components/AppActionRow';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface DashboardRecentAuditsProps {
  audits: Audit[];
  embedded?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return colors.trustGreen;
  if (score >= 60) return colors.warningText;
  return colors.dangerStrong;
}

/** Section « Audits récents » : les trois derniers audits, ou un état vide. */
export function DashboardRecentAudits({
  audits,
  embedded = false,
}: DashboardRecentAuditsProps) {
  return (
    <View style={[styles.section, embedded && styles.embedded]}>
      <View style={embedded && styles.heading}>
        <AppSectionHeader
          title="Audits récents"
          actionLabel="Voir tout →"
          onAction={() => router.push('/audits')}
        />
      </View>
      <View style={[styles.list, embedded && styles.embeddedList]}>
        {[...audits]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 3)
          .map((audit) => (
            <AppActionRow
              key={audit.id}
              style={styles.item}
              href="/audits"
              accessibilityRole="link"
              accessibilityLabel={`${audit.title}. Ouvrir les audits`}
            >
              <View style={styles.icon}>
                {audit.status === 'completed' ? (
                  <CheckCircle size={17} color={colors.trustGreen} />
                ) : (
                  <AlertTriangle size={17} color={colors.warningText} />
                )}
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{audit.title}</Text>
                <Text style={styles.time}>
                  {audit.status === 'completed' ? 'Terminé' : 'En cours'} ·{' '}
                  {new Date(audit.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              {audit.score != null && (
                <Text
                  style={[styles.score, { color: scoreColor(audit.score) }]}
                >
                  {audit.score}%
                </Text>
              )}
              <AppActionIndicator />
            </AppActionRow>
          ))}

        {audits.length === 0 && (
          <AppActionRow
            style={styles.empty}
            href="/audits"
            accessibilityRole="link"
          >
            <BarChart3 size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun audit récent</Text>
            <Text style={styles.emptyLink}>Créer un audit →</Text>
          </AppActionRow>
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
  list: {
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
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm + 2,
  },
  icon: {
    width: 20,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  time: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 2,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
