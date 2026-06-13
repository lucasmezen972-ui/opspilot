import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { Profile } from '../../lib/supabase';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

interface DashboardProgressProps {
  profile: Profile;
}

/** Section « Votre progression » : niveau, XP et barre d'avancement. */
export function DashboardProgress({ profile }: DashboardProgressProps) {
  const level = profile.level ?? 1;
  const xp = profile.xp ?? 0;
  const remaining = Math.max(0, level * 100 - xp);

  return (
    <View style={styles.section}>
      <AppSectionHeader
        title="Votre progression"
        actionLabel="Classement →"
        onAction={() => router.push('/training')}
      />
      <View style={styles.panel}>
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Niv. {level}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelName}>{profile.full_name}</Text>
            <Text style={styles.levelXP}>
              {xp} XP · {profile.completed_trainings ?? 0} formations
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileBtnText}>Profil</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, xp % 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {remaining} XP jusqu'au niveau suivant
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
    ...shadow.card,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm + 2,
  },
  levelBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  levelBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
  levelXP: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  profileBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
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
    fontSize: 11,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
