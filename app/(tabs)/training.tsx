import {
  Play,
  BookOpen,
  Clock,
  CircleCheck as CheckCircle,
  Star,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useTraining } from '../../hooks/useTraining';
import { generateTrainingContent } from '../../lib/openai';
import { courses as defaultCourses, type TrainingCourse } from '../../data/training';

export default function TrainingScreen() {
  const { profile } = useAuth();
  const {
    courses: remoteCourses,
    progress: remoteProgress,
    loading: trainingLoading,
    startCourse,
    updateProgress,
  } = useTraining();
  const [localCourses, setLocalCourses] = useState<TrainingCourse[]>(defaultCourses);

  // Merge remote courses (Supabase) with local user progression.
  // Fall back to the curated demo courses when the DB is empty so that the
  // screen always has something to show in a fresh environment.
  const courses: TrainingCourse[] = useMemo(() => {
    if (!remoteCourses || remoteCourses.length === 0) {
      return localCourses;
    }
    return remoteCourses.map((c) => {
      const p = remoteProgress.find((pr) => pr.training_id === c.id);
      const status: TrainingCourse['status'] = p?.status === 'completed'
        ? 'completed'
        : p?.status === 'in_progress'
          ? 'in_progress'
          : 'not_started';
      return {
        id: c.id,
        title: c.title,
        description: (c.content || '').substring(0, 160) || 'Formation OpsPilot',
        duration_minutes: c.duration_minutes || 30,
        progress: p?.progress_percentage ?? 0,
        status,
        difficulty: c.difficulty,
        xp_reward: c.xp_reward ?? 50,
        ai_generated: c.ai_generated ?? false,
        modules: [],
      };
    });
  }, [remoteCourses, remoteProgress, localCourses]);

  const isRemote = (remoteCourses?.length ?? 0) > 0;

  const [achievements] = useState([
    { id: 1, title: 'Premier cours terminé', icon: '🎓', unlocked: true },
    { id: 2, title: 'Semaine parfaite', icon: '⭐', unlocked: true },
    { id: 3, title: 'Expert formation', icon: '🏆', unlocked: false },
    { id: 4, title: 'Mentor', icon: '👨‍🏫', unlocked: false },
  ]);

  const [generatingCourse, setGeneratingCourse] = useState(false);

  // Stats calculées
  const completedCourses = courses.filter(
    (c) => c.status === 'completed',
  ).length;
  const totalStudyTime = courses
    .filter((c) => c.status === 'completed')
    .reduce((total, course) => total + course.duration_minutes, 0);
  const avgScore = 87; // Pourrait être calculé depuis les vrais résultats

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

  const handleStartCourse = async (courseId: string) => {
    if (isRemote) {
      const res = await startCourse(courseId);
      if (res && 'error' in res && res.error) {
        Alert.alert('Erreur', String(res.error));
        return;
      }
    } else {
      setLocalCourses(
        localCourses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                status: 'in_progress',
                progress: Math.max(1, course.progress),
              }
            : course,
        ),
      );
    }
    Alert.alert(
      'Formation démarrée',
      'Vous pouvez maintenant suivre cette formation !',
    );
  };

  const handleContinueCourse = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || course.progress >= 100) return;

    const newProgress = Math.min(100, course.progress + 20);
    const newStatus = newProgress === 100 ? 'completed' : 'in_progress';

    if (isRemote) {
      const res = await updateProgress(courseId, newProgress);
      if (res && 'error' in res && res.error) {
        Alert.alert('Erreur', String(res.error));
        return;
      }
    } else {
      setLocalCourses(
        localCourses.map((c) =>
          c.id === courseId
            ? { ...c, progress: newProgress, status: newStatus }
            : c,
        ),
      );
    }

    if (newStatus === 'completed') {
      Alert.alert(
        'Félicitations !',
        `Formation "${course.title}" terminée avec succès ! Vous gagnez ${course.xp_reward} XP.`,
      );
    } else {
      Alert.alert(
        'Progression',
        `Formation mise à jour : ${newProgress}% terminé`,
      );
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

      const newCourse: TrainingCourse = {
        id: Date.now().toString(),
        title: content.title,
        description: content.content.substring(0, 150) + '...',
        duration_minutes: 30,
        progress: 0,
        status: 'not_started',
        difficulty: randomDifficulty as TrainingCourse['difficulty'],
        xp_reward:
          randomDifficulty === 'beginner'
            ? 50
            : randomDifficulty === 'intermediate'
              ? 75
              : 100,
        ai_generated: true,
        modules: [],
      };

      setLocalCourses([newCourse, ...localCourses]);

      Alert.alert(
        '🤖 Formation IA créée !',
        `"${content.title}" a été généré et ajouté à vos formations disponibles.`,
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
        <Text style={styles.title}>Formation</Text>
        <View style={styles.pointsBadge}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>{profile?.xp || 0} XP</Text>
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
            <TouchableOpacity key={course.id} style={styles.courseCard}>
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
                  <Text style={styles.courseMetaText}>Formation complète</Text>
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
                    style={[
                      styles.statusText,
                      { color: getStatusColor(course.status) },
                    ]}
                  >
                    {getStatusText(course.status)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    if (course.status === 'not_started') {
                      handleStartCourse(course.id);
                    } else {
                      handleContinueCourse(course.id);
                    }
                  }}
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classement de l'équipe</Text>
          <View style={styles.leaderboard}>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>1</Text>
              </View>
              <Text style={styles.leaderboardName}>
                {profile?.full_name || 'Vous'}
              </Text>
              <Text style={styles.leaderboardPoints}>
                {profile?.xp || 0} XP
              </Text>
            </View>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>2</Text>
              </View>
              <Text style={styles.leaderboardName}>Pierre Martin</Text>
              <Text style={styles.leaderboardPoints}>
                {Math.max(0, (profile?.xp || 0) - 50)} XP
              </Text>
            </View>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>3</Text>
              </View>
              <Text style={styles.leaderboardName}>Jean Leroy</Text>
              <Text style={styles.leaderboardPoints}>
                {Math.max(0, (profile?.xp || 0) - 100)} XP
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leaderboardRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  leaderboardPoints: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
