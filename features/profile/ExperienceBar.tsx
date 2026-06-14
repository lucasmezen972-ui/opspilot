import { View, Text, StyleSheet } from 'react-native';

import type { XpProgress } from './profileModel';
import { colors, shadow } from '../../shared/styles/tokens';

interface ExperienceBarProps {
  progress: XpProgress;
}

/** Barre de progression d'expérience vers le niveau suivant. */
export function ExperienceBar({ progress }: ExperienceBarProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Progression</Text>
        <Text style={styles.points}>
          {progress.xp}/{progress.xpForNextLevel} XP
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${progress.percent}%` }]} />
      </View>
      <Text style={styles.subtext}>
        {progress.remaining > 0
          ? `Plus que ${progress.remaining} XP pour atteindre le niveau ${progress.level + 1} !`
          : 'Niveau maximum atteint !'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  points: {
    fontSize: 14,
    color: '#6B7280',
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
