import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { colors, radius, shadow } from '../../shared/styles/tokens';

interface Achievement {
  id: number;
  title: string;
  icon: string;
  unlocked: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 1, title: 'Premier cours terminé', icon: '🎓', unlocked: true },
  { id: 2, title: 'Semaine parfaite', icon: '⭐', unlocked: true },
  { id: 3, title: 'Expert formation', icon: '🏆', unlocked: false },
  { id: 4, title: 'Mentor', icon: '👨‍🏫', unlocked: false },
];

/** Section « Vos badges » : badges de gamification débloqués ou non. */
export function TrainingAchievements() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vos badges</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      >
        {ACHIEVEMENTS.map((achievement) => (
          <View
            key={achievement.id}
            style={[styles.card, !achievement.unlocked && styles.cardLocked]}
          >
            <Text style={styles.icon}>{achievement.icon}</Text>
            <Text
              style={[
                styles.title,
                !achievement.unlocked && styles.titleLocked,
              ]}
            >
              {achievement.title}
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
    opacity: 0.5,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textStrong,
    textAlign: 'center',
  },
  titleLocked: {
    color: colors.textFaint,
  },
});
