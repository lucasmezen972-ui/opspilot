import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import {
  generateCertificateNumber,
  isCertificateIdentityComplete,
  openCertificate,
} from '../features/training/certificate';
import {
  calculateReadingProgress,
  uniqueChapterIds,
} from '../features/training/progress';
import { isQuizPassed } from '../features/training/quizEngine';
import { demoId } from '../lib/demoData';
import {
  getDemoState,
  updateDemoCollection,
  useDemoCollection,
} from '../lib/demoStore';
import {
  supabase,
  type Training,
  type TrainingCertificate,
  type TrainingChapter,
  type TrainingQuizQuestion,
  type UserTrainingProgress,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

/** Identité confirmée + traçabilité passées à la génération d'attestation. */
export interface CertificateOptions {
  fullName?: string;
  employeeId?: string;
  position?: string;
  store?: string;
  quizVersion?: string;
  attemptNumber?: number;
  status?: 'validé' | 'échoué';
}

export function useTraining() {
  const [remoteCourses, setRemoteCourses] = useState<Training[]>([]);
  const [remoteChapters, setRemoteChapters] = useState<TrainingChapter[]>([]);
  const [remoteQuizQuestions, setRemoteQuizQuestions] = useState<
    TrainingQuizQuestion[]
  >([]);
  const [remoteProgress, setRemoteProgress] = useState<UserTrainingProgress[]>(
    [],
  );
  const [remoteCertificates, setRemoteCertificates] = useState<
    TrainingCertificate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, fetchProfile, updateProfile, isDemoMode, session } =
    useAuth();

  // Mode démo local (Supabase injoignable) : store partagé entre écrans.
  const isLocalDemo = isDemoMode && !session;
  const demoCourses = useDemoCollection('trainings');
  const demoChapters = useDemoCollection('trainingChapters');
  const demoQuizQuestions = useDemoCollection('trainingQuizQuestions');
  const demoProgress = useDemoCollection('trainingProgress');
  const demoCertificates = useDemoCollection('trainingCertificates');
  const courses = isLocalDemo ? demoCourses : remoteCourses;
  const chapters = isLocalDemo ? demoChapters : remoteChapters;
  const quizQuestions = isLocalDemo ? demoQuizQuestions : remoteQuizQuestions;
  const progress = isLocalDemo ? demoProgress : remoteProgress;
  const certificates = isLocalDemo ? demoCertificates : remoteCertificates;

  const fetchTrainingData = useCallback(async () => {
    if (isLocalDemo || !profile?.organization_id || !profile.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer les cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('trainings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (coursesError) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération des cours',
            coursesError,
          ),
        );
        return;
      }

      setRemoteCourses(coursesData || []);

      const courseIds = (coursesData || []).map((course) => course.id);
      if (courseIds.length > 0) {
        const [chaptersResult, quizResult] = await Promise.all([
          supabase
            .from('training_chapters')
            .select('*')
            .in('training_id', courseIds)
            .order('sort_order', { ascending: true }),
          supabase
            .from('training_question_bank')
            .select('*')
            .in('training_id', courseIds)
            .order('sort_order', { ascending: true }),
        ]);

        if (chaptersResult.error) {
          setError(
            mapSupabaseError(
              'Erreur lors de la récupération des chapitres',
              chaptersResult.error,
            ),
          );
          return;
        }
        if (quizResult.error) {
          setError(
            mapSupabaseError(
              'Erreur lors de la récupération du quiz',
              quizResult.error,
            ),
          );
          return;
        }

        setRemoteChapters((chaptersResult.data || []) as TrainingChapter[]);
        setRemoteQuizQuestions(
          (quizResult.data || []) as TrainingQuizQuestion[],
        );
      } else {
        setRemoteChapters([]);
        setRemoteQuizQuestions([]);
      }

      // Récupérer la progression et les certificats de l'utilisateur
      const [progressResult, certResult] = await Promise.all([
        supabase
          .from('user_training_progress')
          .select('*')
          .eq('user_id', profile.id),
        supabase
          .from('training_certificates')
          .select('*')
          .eq('user_id', profile.id),
      ]);

      if (progressResult.error) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération de la progression',
            progressResult.error,
          ),
        );
        return;
      }

      setRemoteProgress(progressResult.data || []);

      // Les certificats sont secondaires : on n'interrompt pas le chargement
      // de la formation si leur récupération échoue.
      if (certResult.error) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération des certificats',
            certResult.error,
          ),
        );
      } else {
        setRemoteCertificates((certResult.data || []) as TrainingCertificate[]);
      }
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchTrainingData', err));
    } finally {
      setLoading(false);
    }
  }, [isLocalDemo, profile?.organization_id, profile?.id]);

  useEffect(() => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    if (profile?.organization_id) {
      fetchTrainingData();
    }
  }, [fetchTrainingData, isLocalDemo, profile?.organization_id]);

  const startCourse = async (courseId: string) => {
    if (!profile) return { error: 'Utilisateur non connecté' };

    try {
      // Vérifier si la progression existe déjà
      const existingProgress = progress.find((p) => p.training_id === courseId);

      if (existingProgress) {
        return { data: existingProgress };
      }

      if (isLocalDemo) {
        const now = new Date().toISOString();
        const data: UserTrainingProgress = {
          id: demoId('demo-progress'),
          user_id: profile.id,
          training_id: courseId,
          status: 'in_progress',
          progress_percentage: 0,
          completed_chapter_ids: [],
          score: null,
          started_at: now,
          completed_at: null,
          created_at: now,
          updated_at: now,
        };
        updateDemoCollection('trainingProgress', (prev) => [...prev, data]);
        return { data };
      }

      const { data, error } = await supabase.rpc('start_training', {
        p_training_id: courseId,
      });

      if (error) {
        return {
          error: mapSupabaseError('Erreur lors du démarrage du cours', error),
        };
      }

      setRemoteProgress((prev) => [...prev, data]);
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur startCourse', error) };
    }
  };

  const markChapterRead = async (
    courseId: string,
    chapterId: string,
    totalChapters: number,
  ) => {
    if (!profile) return { error: 'Utilisateur non connecté' };
    if (!isLocalDemo) {
      try {
        const { data, error } = await supabase.rpc('mark_training_chapter', {
          p_training_id: courseId,
          p_chapter_id: chapterId,
        });
        if (error)
          return {
            error: mapSupabaseError('Validation du chapitre impossible', error),
          };
        setRemoteProgress((current) => [
          ...current.filter((p) => p.training_id !== courseId),
          data,
        ]);
        return { data };
      } catch (error) {
        return {
          error: mapSupabaseError('Validation du chapitre impossible', error),
        };
      }
    }

    let courseProgress = progress.find((item) => item.training_id === courseId);
    if (!courseProgress) {
      const started = await startCourse(courseId);
      if (started.error) return started;
      if (!started.data) {
        return { error: 'Impossible de démarrer la formation' };
      }
      courseProgress = started.data;
    }
    if (!courseProgress) {
      return { error: 'Progression de formation introuvable' };
    }

    const completedChapterIds = uniqueChapterIds([
      ...(courseProgress.completed_chapter_ids ?? []),
      chapterId,
    ]);
    const progressPercentage = calculateReadingProgress(
      completedChapterIds,
      totalChapters,
    );
    const updates = {
      completed_chapter_ids: completedChapterIds,
      progress_percentage: progressPercentage,
      status: (courseProgress.status === 'completed'
        ? 'completed'
        : 'in_progress') as UserTrainingProgress['status'],
      updated_at: new Date().toISOString(),
    };

    if (isLocalDemo) {
      const updated = { ...courseProgress, ...updates };
      updateDemoCollection('trainingProgress', (current) =>
        current.map((item) => (item.training_id === courseId ? updated : item)),
      );
      return { data: updated };
    }

    return { error: 'Progression indisponible' };
  };

  const completeQuiz = async (
    courseId: string,
    score: number,
    failedCritical = false,
    submission?: { sessionId: string; answers: (number | number[])[] },
  ) => {
    if (!profile) return { error: 'Utilisateur non connecté' };

    const course = courses.find((c) => c.id === courseId);
    if (!course) return { error: 'Cours non trouvé' };

    // Validation alignée sur le moteur de quiz : seuil propre au module
    // (min_score) et échec bloquant en cas de question critique ratée.
    const passed = isQuizPassed(score, failedCritical, course.min_score ?? 70);
    let existingProgress = progress.find(
      (item) => item.training_id === courseId,
    );
    if (!existingProgress) {
      const started = await startCourse(courseId);
      if (started.error) return started;
      existingProgress = started.data;
    }
    if (!existingProgress) {
      return { error: 'Impossible de créer la progression' };
    }
    const alreadyCompleted = existingProgress.status === 'completed';
    const remainsCompleted = passed || alreadyCompleted;
    const savedScore = alreadyCompleted
      ? Math.max(existingProgress.score ?? 0, score)
      : score;

    if (isLocalDemo) {
      const updates = {
        score: savedScore,
        status: (remainsCompleted
          ? 'completed'
          : 'in_progress') as UserTrainingProgress['status'],
        progress_percentage: remainsCompleted
          ? 100
          : (existingProgress?.progress_percentage ?? 0),
        completed_at: remainsCompleted
          ? (existingProgress?.completed_at ?? new Date().toISOString())
          : null,
        updated_at: new Date().toISOString(),
      };
      const base =
        existingProgress ?? progress.find((p) => p.training_id === courseId);
      const updated = base ? { ...base, ...updates } : null;
      updateDemoCollection('trainingProgress', (prev) =>
        prev.map((p) =>
          p.training_id === courseId ? { ...p, ...updates } : p,
        ),
      );
      if (passed && !alreadyCompleted) {
        const newXP = (profile.xp ?? 0) + course.xp_reward;
        await updateProfile({
          xp: newXP,
          level: Math.floor(newXP / 100) + 1,
          completed_trainings: (profile.completed_trainings ?? 0) + 1,
        });
      }
      return { data: updated, passed };
    }

    try {
      if (!submission?.sessionId)
        return {
          error: 'Relancez l’évaluation avant de valider vos réponses.',
        };
      const { data: result, error } = await supabase.rpc(
        'submit_training_quiz',
        { p_session_id: submission.sessionId, p_answers: submission.answers },
      );
      if (error !== null || !result?.data)
        return { error: mapSupabaseError('Évaluation non enregistrée', error) };
      setRemoteProgress((current) => [
        ...current.filter((p) => p.training_id !== courseId),
        result.data,
      ]);
      if (result.passed) await fetchProfile(profile.id);
      return result as {
        data: UserTrainingProgress;
        passed: boolean;
        score: number;
        failedCritical: boolean;
      };
    } catch (error) {
      return { error: mapSupabaseError('Évaluation non enregistrée', error) };
    }
  };

  const startQuiz = async (courseId: string) => {
    if (isLocalDemo) return { data: null };
    const { data, error } = await supabase.rpc('start_training_quiz', {
      p_training_id: courseId,
    });
    if (error)
      return {
        error: mapSupabaseError('Impossible de démarrer le quiz', error),
      };
    return { data };
  };

  const recordVideoProgress = async (chapterId: string, seconds: number) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || !Number.isFinite(seconds))
      return { error: 'Lecture indisponible' };
    if (isLocalDemo) {
      const current = getDemoState().trainingProgress.find(
        (p) => p.training_id === chapter.training_id,
      );
      const previous = current?.video_progress?.[chapterId];
      const delta = seconds - (previous?.position ?? seconds);
      const data = {
        position: seconds,
        watched: Math.min(
          chapter.video_duration_seconds ?? 0,
          (previous?.watched ?? 0) + (delta >= 0 && delta <= 15 ? delta : 0),
        ),
        last_seen: new Date().toISOString(),
      };
      updateDemoCollection('trainingProgress', (items) =>
        items.map((p) =>
          p.training_id === chapter.training_id
            ? {
                ...p,
                video_progress: { ...p.video_progress, [chapterId]: data },
              }
            : p,
        ),
      );
      return { data };
    }
    const { data, error } = await supabase.rpc('record_training_video', {
      p_chapter_id: chapterId,
      p_position: Math.round(seconds * 10) / 10,
    });
    if (error !== null || !data)
      return { error: mapSupabaseError('Lecture non enregistrée', error) };
    setRemoteProgress((current) =>
      current.map((p) =>
        p.training_id === chapter.training_id
          ? { ...p, video_progress: { ...p.video_progress, [chapterId]: data } }
          : p,
      ),
    );
    return { data };
  };

  const getCourseProgress = (courseId: string) => {
    return progress.find((p) => p.training_id === courseId);
  };

  const getCompletedCourses = () => {
    return progress.filter(
      (p) =>
        p.status === 'completed' &&
        (isLocalDemo || Boolean(p.server_verified_at)),
    );
  };

  const getInProgressCourses = () => {
    return progress.filter((p) => p.status === 'in_progress');
  };

  const getChaptersForCourse = (courseId: string) => {
    return chapters.filter((chapter) => chapter.training_id === courseId);
  };

  const getQuizForCourse = (courseId: string) => {
    return quizQuestions.filter(
      (question) => question.training_id === courseId,
    );
  };

  const getCertificateForCourse = (courseId: string) => {
    return certificates.find((c) => c.training_id === courseId);
  };

  /**
   * Génère (ou récupère) le certificat d'un cours validé et l'ouvre.
   * `options` porte l'identité confirmée du candidat et la traçabilité de
   * l'évaluation (version, tentative) pour une attestation quasi-certifiante.
   */
  const generateCertificate = async (
    courseId: string,
    score: number,
    options?: CertificateOptions,
  ) => {
    if (!profile) return { error: 'Utilisateur non connecté' };
    const course = courses.find((c) => c.id === courseId);
    if (!course) return { error: 'Cours non trouvé' };

    const existing = getCertificateForCourse(courseId);
    if (existing && isLocalDemo) {
      openCertificate(existing, {
        category: course.category,
        durationMinutes: course.duration_minutes,
        organizationName: undefined,
      });
      return { data: existing };
    }

    // Garde-fou : aucune attestation sans candidat identifié (nom + matricule).
    if (!isCertificateIdentityComplete(options)) {
      return {
        error:
          'Identité du candidat requise (nom et matricule) pour délivrer une attestation.',
      };
    }

    const certNumber = generateCertificateNumber(profile.id, courseId);
    const now = new Date().toISOString();
    const cert: TrainingCertificate = {
      id: demoId('cert'),
      user_id: profile.id,
      training_id: courseId,
      organization_id: profile.organization_id ?? profile.id,
      full_name: (() => {
        const candidate = options?.fullName?.trim();
        return candidate && candidate.length > 0
          ? candidate
          : (profile.full_name ?? profile.email);
      })(),
      training_title: course.title,
      score,
      issued_at: now,
      expires_at: null,
      certificate_number: certNumber,
      created_at: now,
      employee_id: options?.employeeId ?? null,
      position: options?.position ?? null,
      store_name: options?.store ?? null,
      category: course.category ?? null,
      duration_minutes: course.duration_minutes ?? null,
      quiz_version: options?.quizVersion ?? null,
      attempt_number: options?.attemptNumber ?? null,
      status: options?.status ?? 'validé',
    };

    if (isLocalDemo) {
      updateDemoCollection('trainingCertificates', (prev) => [...prev, cert]);
      openCertificate(cert, { category: course.category });
      return { data: cert };
    }

    try {
      const { data, error } = await supabase.rpc('issue_training_certificate', {
        p_training_id: courseId,
        p_identity: options,
      });

      if (error) {
        return {
          error: mapSupabaseError('Erreur génération certificat', error),
        };
      }

      setRemoteCertificates((prev) => [
        ...prev.filter((c) => c.training_id !== courseId),
        data as TrainingCertificate,
      ]);
      openCertificate(data as TrainingCertificate, {
        category: course.category,
      });
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur generateCertificate', error) };
    }
  };

  return {
    courses,
    chapters,
    quizQuestions,
    progress,
    certificates,
    loading,
    error,
    startCourse,
    markChapterRead,
    startQuiz,
    recordVideoProgress,
    completeQuiz,
    getCourseProgress,
    getCertificateForCourse,
    generateCertificate,
    getChaptersForCourse,
    getQuizForCourse,
    getCompletedCourses,
    getInProgressCourses,
    refetch: fetchTrainingData,
  };
}
