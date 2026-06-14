import { BookOpen, Clock, TrendingUp } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radius, shadow } from '../../shared/styles/tokens';

interface TrainingStatsOverviewProps {
  completedCourses: number;
  totalStudyTime: number;
  avgScore: number;
}

/** Bandeau de trois statistiques de formation (cours, temps, score moyen). */
export function TrainingStatsOverview({
  completedCourses,
  totalStudyTime,
  avgScore,
}: TrainingStatsOverviewProps) {
  return (
    <View style={styles.overview}>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <BookOpen size={20} color="#2563EB" />
          <Text style={styles.statNumber}>{completedCourses}</Text>
          <Text style={styles.statLabel}>Cours terminés</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={20} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
          </Text>
          <Text style={styles.statLabel}>Temps d'étude</Text>
        </View>
        <View style={styles.statItem}>
          <TrendingUp size={20} color="#10B981" />
          <Text style={styles.statNumber}>{avgScore}%</Text>
          <Text style={styles.statLabel}>Score moyen</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overview: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textStrong,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
