import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { uniqueChapterIds } from './progress';
import {
  createQuizSession,
  isQuizPassed,
  scoreQuizSession,
  type QuizSession,
} from './quizEngine';
import type {
  Training,
  TrainingChapter,
  TrainingQuizQuestion,
  UserTrainingProgress,
} from '../../lib/supabase';

type OperationResult = {
  data?: unknown;
  error?: unknown;
  passed?: boolean;
};

type Props = {
  visible: boolean;
  course: Training | null;
  chapters: TrainingChapter[];
  questions: TrainingQuizQuestion[];
  progress?: UserTrainingProgress;
  onClose: () => void;
  onMarkChapterRead: (
    courseId: string,
    chapterId: string,
    totalChapters: number,
  ) => Promise<OperationResult>;
  onCompleteQuiz: (courseId: string, score: number) => Promise<OperationResult>;
  onGenerateCertificate?: (courseId: string, score: number) => void;
};

function MarkdownBody({ body }: { body: string }) {
  return (
    <View style={styles.markdown}>
      {body.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={index} style={styles.paragraphGap} />;
        if (trimmed.startsWith('# ')) {
          return (
            <Text key={index} style={styles.markdownHeading}>
              {trimmed.slice(2)}
            </Text>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <Text key={index} style={styles.markdownBullet}>
              • {trimmed.slice(2)}
            </Text>
          );
        }
        return (
          <Text key={index} style={styles.markdownText}>
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
}

export function TrainingCourseModal({
  visible,
  course,
  chapters,
  questions,
  progress,
  onClose,
  onMarkChapterRead,
  onCompleteQuiz,
  onGenerateCertificate,
}: Props) {
  const [mode, setMode] = useState<'chapters' | 'quiz' | 'result'>('chapters');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [failedCritical, setFailedCritical] = useState(false);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !course) return;
    const completed = uniqueChapterIds(progress?.completed_chapter_ids ?? []);
    const firstUnread = chapters.findIndex(
      (chapter) => !completed.includes(chapter.id),
    );
    setMode('chapters');
    setChapterIndex(firstUnread >= 0 ? firstUnread : 0);
    setQuestionIndex(0);
    setAnswers([]);
    setLocalCompletedIds(completed);
    setScore(null);
    setFailedCritical(false);
    setQuizSession(null);
  }, [visible, course?.id]);

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.sort_order - b.sort_order),
    [chapters],
  );
  const sortedQuestionsForBank = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
    [questions],
  );
  const sessionQuestions = quizSession?.questions ?? [];
  const currentChapter = sortedChapters[chapterIndex];
  const currentQuestion = sessionQuestions[questionIndex];
  const allChaptersRead =
    sortedChapters.length > 0 &&
    sortedChapters.every((chapter) => localCompletedIds.includes(chapter.id));
  const selectedAnswer = answers[questionIndex];

  if (!course) return null;

  const markCurrentChapterRead = async () => {
    if (!currentChapter || saving) return;
    setSaving(true);
    const result = await onMarkChapterRead(
      course.id,
      currentChapter.id,
      sortedChapters.length,
    );
    setSaving(false);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
      return;
    }

    setLocalCompletedIds((current) =>
      uniqueChapterIds([...current, currentChapter.id]),
    );
    if (chapterIndex < sortedChapters.length - 1) {
      setChapterIndex((current) => current + 1);
    }
  };

  const selectAnswer = (optionIndex: number) => {
    if (selectedAnswer !== undefined) return;
    setAnswers((current) => {
      const next = [...current];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const advanceQuiz = async () => {
    if (selectedAnswer === undefined || saving) return;
    if (questionIndex < sessionQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    const { score: finalScore, failedCritical: fc } = scoreQuizSession(
      sessionQuestions,
      answers,
    );
    setSaving(true);
    const result = await onCompleteQuiz(course.id, finalScore);
    setSaving(false);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
      return;
    }
    setScore(finalScore);
    setFailedCritical(fc);
    setMode('result');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay} testID="training-course-modal">
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                {mode === 'quiz' ? 'Évaluation finale' : course.category}
              </Text>
              <Text style={styles.title}>{course.title}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Fermer la formation"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {mode === 'chapters' && currentChapter && (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Chapitre {chapterIndex + 1} sur {sortedChapters.length}
                </Text>
                <Text style={styles.progressLabel}>
                  {localCompletedIds.length}/{sortedChapters.length} lus
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (localCompletedIds.length / sortedChapters.length) * 100
                      }%`,
                    },
                  ]}
                />
              </View>

              <ScrollView style={styles.body}>
                <Text
                  style={styles.chapterTitle}
                  testID="training-chapter-title"
                >
                  {currentChapter.title}
                </Text>
                <MarkdownBody body={currentChapter.body} />
              </ScrollView>

              <View style={styles.footer}>
                {chapterIndex > 0 && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setChapterIndex((current) => current - 1)}
                  >
                    <ChevronLeft size={18} color="#2563EB" />
                    <Text style={styles.secondaryButtonText}>Précédent</Text>
                  </TouchableOpacity>
                )}
                {allChaptersRead ? (
                  <TouchableOpacity
                    testID="training-quiz-start"
                    style={styles.primaryButton}
                    onPress={() => {
                      setQuizSession(
                        createQuizSession(
                          sortedQuestionsForBank.map((q) => ({
                            ...q,
                            question_type: q.question_type ?? undefined,
                            difficulty: q.difficulty ?? undefined,
                            is_critical: q.is_critical ?? undefined,
                          })),
                        ),
                      );
                      setQuestionIndex(0);
                      setAnswers([]);
                      setMode('quiz');
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      Lancer l'évaluation
                    </Text>
                    <ChevronRight size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    testID="training-chapter-complete"
                    style={styles.primaryButton}
                    onPress={markCurrentChapterRead}
                    disabled={saving}
                  >
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {saving ? 'Enregistrement...' : 'Marquer comme lu'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {mode === 'chapters' && sortedChapters.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Contenu indisponible</Text>
              <Text style={styles.emptyText}>
                Cette formation ne comporte aucun chapitre.
              </Text>
            </View>
          )}

          {mode === 'quiz' && currentQuestion && (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Question {questionIndex + 1} sur {sessionQuestions.length}
                </Text>
                <Text style={styles.progressLabel}>70 % requis</Text>
              </View>
              <ScrollView style={styles.body}>
                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>
                <View style={styles.options}>
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === optionIndex;
                    const isCorrect =
                      selectedAnswer !== undefined &&
                      optionIndex === currentQuestion.correctAnswerIndex;
                    const isWrong =
                      isSelected &&
                      selectedAnswer !== currentQuestion.correctAnswerIndex;
                    return (
                      <TouchableOpacity
                        key={option}
                        testID={`training-quiz-${currentQuestion.id}-option-${optionIndex}`}
                        style={[
                          styles.option,
                          isCorrect && styles.optionCorrect,
                          isWrong && styles.optionWrong,
                          isSelected &&
                            !isCorrect &&
                            !isWrong &&
                            styles.optionSelected,
                        ]}
                        onPress={() => selectAnswer(optionIndex)}
                        disabled={selectedAnswer !== undefined}
                      >
                        <Text style={styles.optionLetter}>
                          {String.fromCharCode(65 + optionIndex)}
                        </Text>
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedAnswer !== undefined && (
                  <View
                    style={[
                      styles.feedback,
                      selectedAnswer === currentQuestion.correctAnswerIndex
                        ? styles.feedbackCorrect
                        : styles.feedbackWrong,
                    ]}
                  >
                    <Text style={styles.feedbackText}>
                      {selectedAnswer === currentQuestion.correctAnswerIndex
                        ? 'Bonne réponse.'
                        : `Réponse incorrecte. La bonne réponse est : ${
                            currentQuestion.options[
                              currentQuestion.correctAnswerIndex
                            ]
                          }.`}
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.footer}>
                <TouchableOpacity
                  testID={
                    questionIndex === sessionQuestions.length - 1
                      ? 'training-quiz-submit'
                      : 'training-quiz-next'
                  }
                  style={[
                    styles.primaryButton,
                    selectedAnswer === undefined && styles.buttonDisabled,
                  ]}
                  onPress={advanceQuiz}
                  disabled={selectedAnswer === undefined || saving}
                >
                  <Text style={styles.primaryButtonText}>
                    {saving
                      ? 'Validation...'
                      : questionIndex === sessionQuestions.length - 1
                        ? 'Voir mon résultat'
                        : 'Question suivante'}
                  </Text>
                  <ChevronRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {mode === 'quiz' && sessionQuestions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Évaluation indisponible</Text>
              <Text style={styles.emptyText}>
                Cette formation ne comporte aucune question d'évaluation.
              </Text>
            </View>
          )}

          {mode === 'result' && score !== null && (
            <View style={styles.result} testID="training-quiz-result">
              <View
                style={[
                  styles.scoreCircle,
                  isQuizPassed(score, failedCritical)
                    ? styles.scorePassed
                    : styles.scoreFailed,
                ]}
              >
                <Text style={styles.scoreText} testID="training-quiz-score">
                  {score}%
                </Text>
              </View>
              <Text style={styles.resultTitle}>
                {isQuizPassed(score, failedCritical)
                  ? 'Formation validée !'
                  : 'Évaluation à retravailler'}
              </Text>
              <Text style={styles.resultText}>
                {isQuizPassed(score, failedCritical)
                  ? `Vous gagnez ${course.xp_reward} XP.`
                  : failedCritical
                    ? 'Une question critique a été ratée. Relisez les procédures obligatoires.'
                    : "Relisez les chapitres puis retentez l'évaluation. Un score de 70 % est requis."}
              </Text>
              {isQuizPassed(score, failedCritical) && onGenerateCertificate && (
                <TouchableOpacity
                  testID="training-certificate-btn"
                  style={styles.certificateButton}
                  onPress={() => onGenerateCertificate(course.id, score)}
                >
                  <Text style={styles.certificateButtonText}>
                    Télécharger l'attestation
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                testID="training-result-close"
                style={styles.primaryButton}
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modal: {
    width: '100%',
    maxWidth: 720,
    height: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { color: '#111827', fontSize: 20, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  progressLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  progressTrack: {
    height: 6,
    margin: 20,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#2563EB' },
  body: { flex: 1, padding: 20 },
  chapterTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  markdown: { paddingBottom: 30 },
  markdownHeading: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  markdownText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 6,
  },
  markdownBullet: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 25,
    paddingLeft: 8,
  },
  paragraphGap: { height: 8 },
  footer: {
    minHeight: 76,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  certificateButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    marginBottom: 10,
    width: '100%',
  },
  certificateButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: '#2563EB', fontWeight: '600' },
  buttonDisabled: { opacity: 0.45 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: { color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  questionText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 20,
  },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  optionLetter: {
    width: 28,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    fontWeight: '700',
  },
  optionText: { flex: 1, color: '#1F2937', fontSize: 15, lineHeight: 21 },
  feedback: { marginTop: 16, padding: 14, borderRadius: 10 },
  feedbackCorrect: { backgroundColor: '#ECFDF5' },
  feedbackWrong: { backgroundColor: '#FEF2F2' },
  feedbackText: { color: '#374151', lineHeight: 20, fontWeight: '600' },
  result: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  scoreCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  scorePassed: { backgroundColor: '#DCFCE7' },
  scoreFailed: { backgroundColor: '#FEE2E2' },
  scoreText: { color: '#111827', fontSize: 34, fontWeight: '800' },
  resultTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultText: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 440,
    marginBottom: 24,
  },
});
