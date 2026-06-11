import {
  Play,
  BookOpen,
  Clock,
  CircleCheck as CheckCircle,
  Star,
  TrendingUp,
  Sparkles,
  Crown,
  Trophy,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { TrainingCourseModal } from '../../features/training/TrainingCourseModal';
import { useAuth } from '../../hooks/useAuth';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useTraining } from '../../hooks/useTraining';
import { generateTrainingContent } from '../../lib/openai';

export default function TrainingScreen() {
  const { profile } = useAuth();
  const { entries: leaderboard } = useLeaderboard();
  const {
    courses: dbCourses,
    loading: _trainingLoading,
    startCourse,
    markChapterRead,
    completeQuiz,
    getCourseProgress,
    getChaptersForCourse,
    getQuizForCourse,
    getCompletedCourses,
  } = useTraining();

  const courses = dbCourses.map((c) => {
    const p = getCourseProgress(c.id);
    return {
      ...c,
      progress: p?.progress_percentage ?? 0,
      status: p?.status ?? 'not_started',
      description: c.content ?? c.category ?? '',
      chapterCount: getChaptersForCourse(c.id).length,
    };
  });

  const [achievements] = useState([
    { id: 1, title: 'Premier cours terminé', icon: '🎓', unlocked: true },
    { id: 2, title: 'Semaine parfaite', icon: '⭐', unlocked: true },
    { id: 3, title: 'Expert formation', icon: '🏆', unlocked: false },
    { id: 4, title: 'Mentor', icon: '👨‍🏫', unlocked: false },
  ]);

  const [generatingCourse, setGeneratingCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse =
    dbCourses.find((course) => course.id === selectedCourseId) ?? null;

  // Stats calculées
  const completedCoursesList = getCompletedCourses();
  const completedCourses = completedCoursesList.length;
  const totalStudyTime = courses
    .filter((c) => c.status === 'completed')
    .reduce((total, course) => total + (course.duration_minutes || 0), 0);
  const avgScore =
    completedCoursesList.length > 0
      ? Math.round(
          completedCoursesList.reduce((sum, p) => sum + (p.score ?? 0), 0) /
            completedCoursesList.length,
        )
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'not_started':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'not_started':
        return 'Pas commencé';
      default:
        return 'Inconnu';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#10B981';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return 'Inconnu';
    }
  };

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
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    const randomDifficulty =
      difficulties[Math.floor(Math.random() * difficulties.length)];

    setGeneratingCourse(true);

    try {
      const content = await generateTrainingContent(
        randomTopic,
        randomDifficulty as any,
      );

      Alert.alert(
        'Formation IA générée',
        `"${content.title}" a été généré. Rechargez pour voir les formations.`,
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer la formation IA.');
      console.error('Erreur génération formation:', error);
    } finally {
      setGeneratingCourse(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <BookOpen size={20} color="#2563EB" />
              <Text style={styles.progressStatNumber}>{completedCourses}</Text>
              <Text style={styles.progressStatLabel}>Cours terminés</Text>
            </View>
            <View style={styles.progressStatItem}>
              <Clock size={20} color="#F59E0B" />
              <Text style={styles.progressStatNumber}>
                {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
              </Text>
              <Text style={styles.progressStatLabel}>Temps d'étude</Text>
            </View>
            <View style={styles.progressStatItem}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.progressStatNumber}>{avgScore}%</Text>
              <Text style={styles.progressStatLabel}>Score moyen</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos badges</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsList}
          >
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                >
                  {achievement.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Courses */}
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
            <View
              key={course.id}
              testID={`training-card-${course.id}`}
              style={styles.courseCard}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseTitleSection}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDescription}>
                    {course.description}
                  </Text>
                </View>
                <View style={styles.coursePoints}>
                  <Star size={14} color="#F59E0B" />
                  <Text style={styles.coursePointsText}>
                    {course.xp_reward}
                  </Text>
                </View>
                {course.ai_generated && (
                  <View style={styles.aiGeneratedBadge}>
                    <Sparkles size={12} color="#8B5CF6" />
                    <Text style={styles.aiGeneratedText}>IA</Text>
                  </View>
                )}
              </View>

              <View style={styles.courseMeta}>
                <View style={styles.courseMetaItem}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.courseMetaText}>
                    {course.duration_minutes} min
                  </Text>
                </View>
                <View style={styles.courseMetaItem}>
                  <BookOpen size={14} color="#6B7280" />
                  <Text style={styles.courseMetaText}>
                    {course.chapterCount} chapitres · quiz final
                  </Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor: `${getDifficultyColor(course.difficulty)}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(course.difficulty) },
                    ]}
                  >
                    {getDifficultyText(course.difficulty)}
                  </Text>
                </View>
              </View>

              {course.progress > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${course.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {course.progress}% terminé
                  </Text>
                </View>
              )}

              <View style={styles.courseActions}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(course.status)}20` },
                  ]}
                >
                  {course.status === 'completed' ? (
                    <CheckCircle
                      size={12}
                      color={getStatusColor(course.status)}
                    />
                  ) : course.status === 'in_progress' ? (
                    <Play size={12} color={getStatusColor(course.status)} />
                  ) : (
                    <BookOpen size={12} color={getStatusColor(course.status)} />
                  )}
                  <Text
                    testID={`training-status-${course.id}`}
                    style={[
                      styles.statusText,
                      { color: getStatusColor(course.status) },
                    ]}
                  >
                    {getStatusText(course.status)}
                  </Text>
                </View>

                <TouchableOpacity
                  testID={`training-open-${course.id}`}
                  style={styles.actionButton}
                  onPress={() => handleOpenCourse(course.id)}
                >
                  <Play size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>
                    {course.status === 'not_started'
                      ? 'Commencer'
                      : course.status === 'in_progress'
                        ? 'Continuer'
                        : 'Revoir'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <View style={styles.leaderboardHeader}>
            <Trophy size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Classement de l'équipe</Text>
          </View>
          <View style={styles.leaderboard}>
            {(leaderboard.length > 0
              ? leaderboard
              : [
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
                ]
            ).map((entry, idx) => {
              const isMe = entry.id === profile?.id;
              const rankColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];
              const rankColor = rankColors[idx] ?? '#6B7280';
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.leaderboardItem,
                    isMe && styles.leaderboardItemMe,
                  ]}
                >
                  <View
                    style={[
                      styles.leaderboardRank,
                      {
                        backgroundColor: idx < 3 ? `${rankColor}20` : '#F3F4F6',
                      },
                    ]}
                  >
                    {idx === 0 ? (
                      <Crown size={14} color={rankColor} />
                    ) : (
                      <Text
                        style={[
                          styles.leaderboardRankText,
                          { color: rankColor },
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text
                      style={[
                        styles.leaderboardName,
                        isMe && { fontWeight: '700' },
                      ]}
                    >
                      {entry.full_name ?? entry.email ?? 'Anonyme'}
                      {isMe ? ' (moi)' : ''}
                    </Text>
                    <Text style={styles.leaderboardSub}>
                      Niv. {entry.level ?? 1} · {entry.completed_trainings ?? 0}{' '}
                      formations
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.leaderboardPoints,
                      idx === 0 && { color: '#F59E0B' },
                    ]}
                  >
                    {entry.xp ?? 0} XP
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
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
  progressOverview: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
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
  achievementsList: {
    flexDirection: 'row',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#9CA3AF',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  coursePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coursePointsText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  aiGeneratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  aiGeneratedText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  leaderboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  leaderboardItemMe: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  leaderboardRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardRankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  leaderboardName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  leaderboardPoints: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '700',
  },
});
