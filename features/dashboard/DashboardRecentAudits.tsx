import { router } from 'expo-router';
import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  ChartBar as BarChart3,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { Audit } from '../../lib/supabase';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

interface DashboardRecentAuditsProps {
  audits: Audit[];
}

function scoreColor(score: number): string {
  if (score >= 80) return colors.trustGreen;
  if (score >= 60) return colors.warningText;
  return colors.dangerStrong;
}

/** Section « Audits récents » : les trois derniers audits, ou un état vide. */
export function DashboardRecentAudits({ audits }: DashboardRecentAuditsProps) {
  return (
    <View style={styles.section}>
      <AppSectionHeader
        title="Audits récents"
        actionLabel="Voir tout →"
        onAction={() => router.push('/audits')}
      />
      <View style={styles.list}>
        {[...audits]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 3)
          .map((audit) => (
            <TouchableOpacity
              key={audit.id}
              style={styles.item}
              onPress={() => router.push('/audits')}
              accessibilityRole="link"
            >
              <View
                style={[
                  styles.icon,
                  {
                    backgroundColor:
                      audit.status === 'completed'
                        ? colors.successSoft
                        : colors.warningSoft,
                  },
                ]}
              >
                {audit.status === 'completed' ? (
                  <CheckCircle size={18} color={colors.trustGreen} />
                ) : (
                  <AlertTriangle size={18} color={colors.warningText} />
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
            </TouchableOpacity>
          ))}

        {audits.length === 0 && (
          <TouchableOpacity
            style={styles.empty}
            onPress={() => router.push('/audits')}
            accessibilityRole="link"
          >
            <BarChart3 size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun audit récent</Text>
            <Text style={styles.emptyLink}>Créer un audit →</Text>
          </TouchableOpacity>
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
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  item: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: spacing.sm + 2,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
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
    fontWeight: '600',
    color: colors.textStrong,
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
