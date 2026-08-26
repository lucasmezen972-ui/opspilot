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
import {
  TrainingCourseModal,
  type CertificateSubmitOptions,
} from '../../features/training/TrainingCourseModal';
import { TrainingLeaderboard } from '../../features/training/TrainingLeaderboard';
import { TrainingStatsOverview } from '../../features/training/TrainingStatsOverview';
import { TrainingSupervision } from '../../features/training/TrainingSupervision';
import {
  computeAverageScore,
  computeStudyTime,
  type TrainingCourseView,
} from '../../features/training/trainingModel';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAuth } from '../../hooks/useAuth';
import {
  useLeaderboard,
  type LeaderboardEntry,
} from '../../hooks/useLeaderboard';
import { useTraining } from '../../hooks/useTraining';
import { useTrainingSupervision } from '../../hooks/useTrainingSupervision';
import { DEMO_ORG_ID, demoId } from '../../lib/demoData';
import { updateDemoCollection } from '../../lib/demoStore';
import { generateTrainingContent } from '../../lib/openai';
import {
  supabase,
  type Training,
  type TrainingChapter,
  type TrainingQuizQuestion,
} from '../../lib/supabase';
import { AppTabBar } from '../../shared/components/AppTabBar';
import { colors } from '../../shared/styles/tokens';
import { logger } from '../../utils/logger';
import { isManagerRole } from '../../utils/roles';

export default function TrainingScreen() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;
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
    refetch,
  } = useTraining();

  const isManager = isManagerRole(profile?.role);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'supervision'>(
    'catalogue',
  );
  const {
    courses: supervisionCourses,
    entries: supervisionEntries,
    sendReminder,
  } = useTrainingSupervision();
  const { logEvent } = useActivityLog();

  // Délivrer une attestation trace la certification dans le journal de gouvernance.
  const handleGenerateCertificate = (
    courseId: string,
    score: number,
    options: CertificateSubmitOptions,
  ) => {
    const course = dbCourses.find((c) => c.id === courseId);
    logEvent({
      action: 'training_certified',
      entityType: 'training',
      entityId: courseId,
      label: `Formation « ${course?.title ?? 'formation'} » validée par ${options.fullName} (matricule ${options.employeeId}, score ${score} %).`,
    });
    generateCertificate(courseId, score, options);
  };

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

      if (!content.title || !content.content) {
        Alert.alert('Erreur', 'Le contenu généré est incomplet.');
        return;
      }

      const now = new Date().toISOString();
      const courseId = demoId('ai-course');
      const orgId = profile?.organization_id ?? DEMO_ORG_ID;

      const newCourse: Training = {
        id: courseId,
        organization_id: orgId,
        title: content.title,
        content: content.content,
        category: randomTopic,
        difficulty: randomDifficulty,
        xp_reward:
          randomDifficulty === 'advanced'
            ? 50
            : randomDifficulty === 'intermediate'
              ? 30
              : 20,
        duration_minutes: 30,
        min_score: 70,
        ai_generated: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      const newChapters: TrainingChapter[] = content.practical_tips.map(
        (tip, i) => ({
          id: demoId(`ai-ch-${i}`),
          training_id: courseId,
          title: `Conseil ${i + 1}`,
          body: tip,
          sort_order: i,
          created_at: now,
        }),
      );

      const newQuestions: TrainingQuizQuestion[] = content.quiz_questions.map(
        (q, i) => ({
          id: demoId(`ai-q-${i}`),
          training_id: courseId,
          question: q.question,
          options: q.options,
          correct_index: q.correct_answer,
          sort_order: i,
          is_critical: false,
          created_at: now,
        }),
      );

      if (isLocalDemo) {
        updateDemoCollection('trainings', (prev) => [newCourse, ...prev]);
        updateDemoCollection('trainingChapters', (prev) => [
          ...prev,
          ...newChapters,
        ]);
        updateDemoCollection('trainingQuizQuestions', (prev) => [
          ...prev,
          ...newQuestions,
        ]);
      } else if (profile?.organization_id) {
        const { data: savedCourse, error: courseErr } = await supabase
          .from('trainings')
          .insert({
            organization_id: orgId,
            title: newCourse.title,
            content: newCourse.content,
            category: newCourse.category,
            difficulty: newCourse.difficulty,
            xp_reward: newCourse.xp_reward,
            duration_minutes: newCourse.duration_minutes,
            min_score: newCourse.min_score,
            ai_generated: true,
            is_active: true,
          })
          .select()
          .single();

        if (courseErr ?? !savedCourse) {
          Alert.alert('Erreur', 'Impossible de sauvegarder la formation.');
          logger.error('Erreur sauvegarde formation IA', courseErr);
          return;
        }

        const realCourseId = savedCourse.id;

        if (newChapters.length > 0) {
          const { error: chapErr } = await supabase
            .from('training_chapters')
            .insert(
              newChapters.map((ch) => ({
                training_id: realCourseId,
                title: ch.title,
                body: ch.body,
                sort_order: ch.sort_order,
              })),
            );
          if (chapErr) {
            logger.error('Erreur sauvegarde chapitres IA', chapErr);
          }
        }

        if (newQuestions.length > 0) {
          const { error: quizErr } = await supabase
            .from('training_quiz_questions')
            .insert(
              newQuestions.map((q) => ({
                training_id: realCourseId,
                question: q.question,
                options: q.options,
                correct_index: q.correct_index,
                sort_order: q.sort_order,
                is_critical: q.is_critical,
              })),
            );
          if (quizErr) {
            logger.error('Erreur sauvegarde quiz IA', quizErr);
          }
        }

        await refetch();
      }

      Alert.alert(
        'Formation IA générée',
        `"${content.title}" est disponible dans le catalogue.`,
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

      {isManager && (
        <AppTabBar
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              key: 'catalogue',
              label: 'Catalogue',
              testID: 'training-tab-catalogue',
            },
            {
              key: 'supervision',
              label: 'Supervision',
              testID: 'training-tab-supervision',
            },
          ]}
        />
      )}

      {isManager && activeTab === 'supervision' ? (
        <TrainingSupervision
          courses={supervisionCourses}
          entries={supervisionEntries}
          onSendReminder={sendReminder}
        />
      ) : (
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
      )}

      <TrainingCourseModal
        visible={selectedCourse !== null}
        course={selectedCourse}
        chapters={selectedCourse ? getChaptersForCourse(selectedCourse.id) : []}
        questions={selectedCourse ? getQuizForCourse(selectedCourse.id) : []}
        progress={
          selectedCourse ? getCourseProgress(selectedCourse.id) : undefined
        }
        candidateName={profile?.full_name ?? ''}
        onClose={() => setSelectedCourseId(null)}
        onMarkChapterRead={markChapterRead}
        onCompleteQuiz={completeQuiz}
        onGenerateCertificate={handleGenerateCertificate}
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
