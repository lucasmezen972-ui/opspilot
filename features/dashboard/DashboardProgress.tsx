import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import type { Profile } from '../../lib/supabase';
import { AppActionRow } from '../../shared/components/AppActionRow';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing } from '../../shared/styles/tokens';
import { computeXpProgress } from '../profile/profileModel';

interface DashboardProgressProps {
  profile: Profile;
  compact?: boolean;
  embedded?: boolean;
}

/** Section « Votre progression » : niveau, XP et barre d'avancement. */
export function DashboardProgress({
  profile,
  compact = false,
  embedded = false,
}: DashboardProgressProps) {
  const level = profile.level ?? 1;
  const xp = profile.xp ?? 0;
  const progress = computeXpProgress(level, xp);
  const remaining = Math.max(0, progress.remaining);

  return (
    <View style={!embedded && styles.section}>
      {compact ? (
        <View style={styles.compactHeading}>
          <Text style={styles.compactTitle} accessibilityRole="header">
            Votre progression
          </Text>
          <AppActionRow
            style={styles.headingAction}
            hoverStyle={{ backgroundColor: colors.controlHover }}
            pressedStyle={{ backgroundColor: colors.controlPressed }}
            href="/training"
            accessibilityRole="link"
            accessibilityLabel="Classement et formation"
          >
            <ArrowUpRight size={17} color={colors.primary} />
          </AppActionRow>
        </View>
      ) : (
        <AppSectionHeader
          title="Votre progression"
          actionLabel="Classement →"
          onAction={() => router.push('/training')}
        />
      )}
      <View style={[styles.panel, embedded && styles.embeddedPanel]}>
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Niv. {level}</Text>
          </View>
          <View style={styles.levelInfo}>
            {!compact && (
              <Text style={styles.levelName}>{profile.full_name}</Text>
            )}
            <Text style={styles.levelXP}>{xp} XP</Text>
            <Text style={styles.trainingCount}>
              {profile.completed_trainings ?? 0} formations
            </Text>
          </View>
          <AppActionRow
            style={[styles.profileBtn, compact && styles.compactProfileBtn]}
            hoverStyle={{ backgroundColor: colors.controlHover }}
            pressedStyle={{ backgroundColor: colors.controlPressed }}
            href="/profile"
            accessibilityRole="link"
          >
            <Text style={styles.profileBtnText}>Profil</Text>
          </AppActionRow>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, progress.percent)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(Math.max(0, progress.percent))} % du niveau {level}
          {' · '}
          {remaining} XP avant le suivant
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  embeddedPanel: {
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  compactHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryInk,
    fontWeight: '600',
  },
  headingAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm + 2,
  },
  levelBadge: {
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
  },
  levelBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  levelInfo: {
    flex: 1,
    minWidth: 0,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
  levelXP: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.primaryInk,
    marginTop: 2,
  },
  trainingCount: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  profileBtn: {
    minHeight: 44,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  profileBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  compactProfileBtn: {
    minWidth: 56,
    paddingHorizontal: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: spacing.xs + 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
