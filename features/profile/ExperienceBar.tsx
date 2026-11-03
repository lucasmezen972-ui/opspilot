import { View, Text, StyleSheet } from 'react-native';

import type { XpProgress } from './profileModel';
import { colors, shadow } from '../../shared/styles/tokens';

interface ExperienceBarProps {
  progress: XpProgress;
}

/** Barre de progression d'expérience vers le niveau suivant. */
export function ExperienceBar({ progress }: ExperienceBarProps) {
  const percent = Math.max(0, Math.min(100, progress.percent));
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Progression du niveau {progress.level}</Text>
        <Text style={styles.points}>{Math.round(percent)} %</Text>
      </View>
      <View
        style={styles.bar}
        accessibilityRole="progressbar"
        accessibilityLabel={`Progression vers le niveau ${progress.level + 1}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.subtext}>
        {progress.remaining > 0
          ? `${progress.remaining} XP avant le niveau ${progress.level + 1}`
          : 'Seuil du niveau suivant atteint'}
        {' · '}
        {progress.xp} XP cumulés
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textStrong,
  },
  points: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  bar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  subtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
