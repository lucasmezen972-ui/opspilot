import {
  GraduationCap,
  Medal,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { colors, radius, shadow } from '../../shared/styles/tokens';

interface Achievement {
  id: number;
  title: string;
  icon: LucideIcon;
  unlocked: boolean;
}

/** Section « Vos badges » : badges de gamification débloqués ou non. */
export function TrainingAchievements({
  completedCourses,
}: {
  completedCourses: number;
}) {
  const achievements: Achievement[] = [
    {
      id: 1,
      title: 'Premier cours terminé',
      icon: GraduationCap,
      unlocked: completedCourses >= 1,
    },
    {
      id: 2,
      title: '5 formations validées',
      icon: Medal,
      unlocked: completedCourses >= 5,
    },
    {
      id: 3,
      title: '10 formations validées',
      icon: Trophy,
      unlocked: completedCourses >= 10,
    },
  ];
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vos badges</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      >
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[styles.card, !achievement.unlocked && styles.cardLocked]}
          >
            <View style={styles.icon}>
              <achievement.icon
                size={24}
                color={achievement.unlocked ? colors.primary : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.title,
                !achievement.unlocked && styles.titleLocked,
              ]}
            >
              {achievement.title}
            </Text>
            <Text style={styles.title}>
              {achievement.unlocked ? 'Obtenu' : 'À obtenir'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 16,
  },
  list: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  cardLocked: {
    backgroundColor: colors.background,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textStrong,
    textAlign: 'center',
  },
  titleLocked: {
    color: colors.textMuted,
  },
});
