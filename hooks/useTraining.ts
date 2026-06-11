import { useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import {
  calculateReadingProgress,
  uniqueChapterIds,
} from '../features/training/progress';
import { demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type Training,
  type TrainingChapter,
  type TrainingQuizQuestion,
  type UserTrainingProgress,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTraining() {
  const [remoteCourses, setRemoteCourses] = useState<Training[]>([]);
  const [remoteChapters, setRemoteChapters] = useState<TrainingChapter[]>([]);
  const [remoteQuizQuestions, setRemoteQuizQuestions] = useState<
    TrainingQuizQuestion[]
  >([]);
  const [remoteProgress, setRemoteProgress] = useState<UserTrainingProgress[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const { profile, fetchProfile, updateProfile, isDemoMode, session } =
    useAuth();

  // Mode démo local (Supabase injoignable) : store partagé entre écrans.
  const isLocalDemo = isDemoMode && !session;
  const demoCourses = useDemoCollection('trainings');
  const demoChapters = useDemoCollection('trainingChapters');
  const demoQuizQuestions = useDemoCollection('trainingQuizQuestions');
  const demoProgress = useDemoCollection('trainingProgress');
  const courses = isLocalDemo ? demoCourses : remoteCourses;
  const chapters = isLocalDemo ? demoChapters : remoteChapters;
  const quizQuestions = isLocalDemo ? demoQuizQuestions : remoteQuizQuestions;
  const progress = isLocalDemo ? demoProgress : remoteProgress;

  useEffect(() => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    if (profile?.organization_id) {
      fetchTrainingData();
    }
  }, [profile?.organization_id, profile?.id, isLocalDemo]);

  const fetchTrainingData = async () => {
    if (isLocalDemo || !profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer les cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('trainings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (coursesError) {
        mapSupabaseError(
          'Erreur lors de la récupération des cours',
          coursesError,
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
            .from('training_quiz_questions')
            .select('*')
            .in('training_id', courseIds)
            .order('sort_order', { ascending: true }),
        ]);

        if (chaptersResult.error) {
          mapSupabaseError(
            'Erreur lors de la récupération des chapitres',
            chaptersResult.error,
          );
          return;
        }
        if (quizResult.error) {
          mapSupabaseError(
            'Erreur lors de la récupération du quiz',
            quizResult.error,
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

      // Récupérer la progression de l'utilisateur
      const { data: progressData, error: progressError } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', profile.id);

      if (progressError) {
        mapSupabaseError(
          'Erreur lors de la récupération de la progression',
          progressError,
        );
        return;
      }

      setRemoteProgress(progressData || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchTrainingData', error);
    } finally {
      setLoading(false);
    }
  };

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

      // Créer une nouvelle progression
      const { data, error } = await supabase
        .from('user_training_progress')
        .insert({
          user_id: profile.id,
          training_id: courseId,
          status: 'in_progress',
          progress_percentage: 0,
          completed_chapter_ids: [],
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          error: mapSupabaseError('Erreur lors du démarrage du cours', error),
        };
      }

      setRemoteProgress([...progress, data]);
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
      let updated: UserTrainingProgress | null = null;
      updateDemoCollection('trainingProgress', (current) =>
        current.map((item) => {
          if (item.training_id !== courseId) return item;
          updated = { ...item, ...updates };
          return updated;
        }),
      );
      return { data: updated };
    }

    const { data, error } = await supabase
      .from('user_training_progress')
      .update(updates)
      .eq('user_id', profile.id)
      .eq('training_id', courseId)
      .select()
      .single();

    if (error) {
      return {
        error: mapSupabaseError(
          'Erreur lors de la validation du chapitre',
          error,
        ),
      };
    }

    setRemoteProgress((current) =>
      current.map((item) => (item.training_id === courseId ? data : item)),
    );
    return { data };
  };

  const completeQuiz = async (courseId: string, score: number) => {
    if (!profile) return { error: 'Utilisateur non connecté' };

    const course = courses.find((c) => c.id === courseId);
    if (!course) return { error: 'Cours non trouvé' };

    // Passing score is fixed at 70%
    const passed = score >= 70;
    const existingProgress = progress.find(
      (item) => item.training_id === courseId,
    );
    const alreadyCompleted = existingProgress?.status === 'completed';
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
      let updated: UserTrainingProgress | null = null;
      updateDemoCollection('trainingProgress', (prev) =>
        prev.map((p) => {
          if (p.training_id !== courseId) return p;
          updated = { ...p, ...updates };
          return updated;
        }),
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
      const { data, error } = await supabase
        .from('user_training_progress')
        .update({
          score: savedScore,
          status: remainsCompleted ? 'completed' : 'in_progress',
          progress_percentage: remainsCompleted
            ? 100
            : (existingProgress?.progress_percentage ?? 0),
          completed_at: remainsCompleted
            ? (existingProgress?.completed_at ?? new Date().toISOString())
            : null,
        })
        .eq('user_id', profile.id)
        .eq('training_id', courseId)
        .select()
        .single();

      if (error) {
        return {
          error: mapSupabaseError(
            'Erreur lors de la validation du quiz',
            error,
          ),
        };
      }

      setRemoteProgress(
        progress.map((p) => (p.training_id === courseId ? data : p)),
      );

      // Si réussi, ajouter les XP
      if (passed && !alreadyCompleted) {
        await addXP(course.xp_reward);
      }

      return { data, passed };
    } catch (error) {
      return { error: mapSupabaseError('Erreur completeQuiz', error) };
    }
  };

  const addXP = async (xpAmount: number) => {
    if (!profile) return;

    try {
      const newXP = profile.xp + xpAmount;
      const newLevel = Math.floor(newXP / 100) + 1;

      await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profile?.id) {
        await fetchProfile(profile.id);
      }
    } catch (error) {
      mapSupabaseError("Erreur lors de l'ajout d'XP", error);
    }
  };

  const getCourseProgress = (courseId: string) => {
    return progress.find((p) => p.training_id === courseId);
  };

  const getCompletedCourses = () => {
    return progress.filter((p) => p.status === 'completed');
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

  return {
    courses,
    chapters,
    quizQuestions,
    progress,
    loading,
    startCourse,
    markChapterRead,
    completeQuiz,
    getCourseProgress,
    getChaptersForCourse,
    getQuizForCourse,
    getCompletedCourses,
    getInProgressCourses,
    refetch: fetchTrainingData,
  };
}
