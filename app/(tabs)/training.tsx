import { Star, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { TrainingAchievements } from '../../features/training/TrainingAchievements';
import { TrainingCourseCard } from '../../features/training/TrainingCourseCard';
import { TrainingCourseModal } from '../../features/training/TrainingCourseModal';
import { TrainingLeaderboard } from '../../features/training/TrainingLeaderboard';
import { TrainingStatsOverview } from '../../features/training/TrainingStatsOverview';
import {
  computeAverageScore,
  computeStudyTime,
  type TrainingCourseView,
} from '../../features/training/trainingModel';
import { useAuth } from '../../hooks/useAuth';
import {
  useLeaderboard,
  type LeaderboardEntry,
} from '../../hooks/useLeaderboard';
import { useTraining } from '../../hooks/useTraining';
import { generateTrainingContent } from '../../lib/openai';
import { colors } from '../../shared/styles/tokens';
import { logger } from '../../utils/logger';

export default function TrainingScreen() {
  const { profile } = useAuth();
  const { entries: leaderboard } = useLeaderboard();
  const {
    courses: dbCourses,
    startCourse,
    markChapterRead,
    completeQuiz,
    generateCertificate,
    getCourseProgress,
    getChaptersForCourse,
    getQuizForCourse,
    getCompletedCourses,
  } = useTraining();

  const courses: TrainingCourseView[] = dbCourses.map((c) => {
    const progress = getCourseProgress(c.id);
    return {
      id: c.id,
      title: c.title,
      description: c.content ?? c.category ?? '',
      xp_reward: c.xp_reward,
      ai_generated: c.ai_generated,
      duration_minutes: c.duration_minutes,
      chapterCount: getChaptersForCourse(c.id).length,
      difficulty: c.difficulty,
      progress: progress?.progress_percentage ?? 0,
      status: progress?.status ?? 'not_started',
    };
  });

  const [generatingCourse, setGeneratingCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse =
    dbCourses.find((course) => course.id === selectedCourseId) ?? null;

  const completedCoursesList = getCompletedCourses();
  const completedCourses = completedCoursesList.length;
  const totalStudyTime = computeStudyTime(courses);
  const avgScore = computeAverageScore(completedCoursesList);

  const leaderboardEntries: LeaderboardEntry[] = useMemo(() => {
    if (leaderboard.length > 0) return leaderboard;
    return [
      {
        id: profile?.id ?? '',
        full_name: profile?.full_name ?? 'Vous',
        email: '',
        role: profile?.role ?? 'employé',
        xp: profile?.xp ?? 0,
        level: profile?.level ?? 1,
        completed_trainings: profile?.completed_trainings ?? 0,
        total_audits: profile?.total_audits ?? 0,
        avg_score: profile?.avg_score ?? 0,
      },
    ];
  }, [leaderboard, profile]);

  const handleOpenCourse = async (courseId: string) => {
    const result = await startCourse(courseId);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      setSelectedCourseId(courseId);
    }
  };

  const generateAICourse = async () => {
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      Alert.alert(
        'IA non disponible',
        'Clé OpenAI manquante pour générer du contenu de formation.',
      );
      return;
    }

    const topics = [
      'Techniques de vente cross-selling',
      'Gestion des clients difficiles',
      'Optimisation de la présentation produits',
      "Procédures d'ouverture/fermeture de magasin",
      'Sécurité au travail dans la grande distribution',
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)]!;
    const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
    const randomDifficulty =
      difficulties[Math.floor(Math.random() * difficulties.length)]!;

    setGeneratingCourse(true);

    try {
      const content = await generateTrainingContent(
        randomTopic,
        randomDifficulty,
      );
      Alert.alert(
        'Formation IA générée',
        `"${content.title}" a été généré. Rechargez pour voir les formations.`,
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer la formation IA.');
      logger.error('Erreur génération formation', error);
    } finally {
      setGeneratingCourse(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} testID="page-training-title">
          Formation
        </Text>
        <View style={styles.pointsBadge}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.pointsText} testID="training-xp-value">
            {profile?.xp ?? 0} XP
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <TrainingStatsOverview
          completedCourses={completedCourses}
          totalStudyTime={totalStudyTime}
          avgScore={avgScore}
        />

        <TrainingAchievements />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Formations disponibles</Text>
            {process.env.EXPO_PUBLIC_OPENAI_API_KEY && (
              <TouchableOpacity
                style={styles.aiGenerateButton}
                onPress={generateAICourse}
                disabled={generatingCourse}
              >
                <Sparkles size={16} color="#F59E0B" />
                <Text style={styles.aiGenerateButtonText}>
                  {generatingCourse ? 'Génération...' : 'IA'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {courses.map((course) => (
            <TrainingCourseCard
              key={course.id}
              course={course}
              onOpen={handleOpenCourse}
            />
          ))}
        </View>

        <TrainingLeaderboard
          entries={leaderboardEntries}
          currentUserId={profile?.id}
        />
      </ScrollView>

      <TrainingCourseModal
        visible={selectedCourse !== null}
        course={selectedCourse}
        chapters={selectedCourse ? getChaptersForCourse(selectedCourse.id) : []}
        questions={selectedCourse ? getQuizForCourse(selectedCourse.id) : []}
        progress={
          selectedCourse ? getCourseProgress(selectedCourse.id) : undefined
        }
        onClose={() => setSelectedCourseId(null)}
        onMarkChapterRead={markChapterRead}
        onCompleteQuiz={completeQuiz}
        onGenerateCertificate={generateCertificate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.4,
    fontWeight: '700',
    color: colors.textStrong,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  aiGenerateButtonText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
