import { useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import { DEMO_TRAININGS } from '../lib/demo';
import {
  supabase,
  type Training,
  type UserTrainingProgress,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTraining() {
  const [courses, setCourses] = useState<Training[]>([]);
  const [progress, setProgress] = useState<UserTrainingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
      setCourses(DEMO_TRAININGS);
      setProgress([
        {
          id: 'demo-progress-001',
          user_id: profile?.id || '',
          training_id: 'demo-training-001',
          status: 'completed',
          progress_percentage: 100,
          score: 90,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
        {
          id: 'demo-progress-002',
          user_id: profile?.id || '',
          training_id: 'demo-training-002',
          status: 'in_progress',
          progress_percentage: 40,
          score: null,
          started_at: new Date().toISOString(),
          completed_at: null,
        },
      ]);
      setLoading(false);
      return;
    }

    if (profile?.organization_id) {
      fetchTrainingData();
    }
  }, [profile?.organization_id, profile?.id, isDemo]);

  const fetchTrainingData = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      const { data: coursesData, error: coursesError } = await supabase
        .from('trainings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (coursesError) {
        mapSupabaseError(
          'Erreur lors de la recuperation des cours',
          coursesError,
        );
        return;
      }

      setCourses(coursesData || []);

      const { data: progressData, error: progressError } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', profile.id);

      if (progressError) {
        mapSupabaseError(
          'Erreur lors de la recuperation de la progression',
          progressError,
        );
        return;
      }

      setProgress(progressData || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchTrainingData', error);
    } finally {
      setLoading(false);
    }
  };

  const startCourse = async (courseId: string) => {
    if (!profile) return { error: 'Utilisateur non connecte' };

    const existingProgress = progress.find((p) => p.training_id === courseId);
    if (existingProgress) {
      return { data: existingProgress };
    }

    if (isDemo) {
      const newProgress: UserTrainingProgress = {
        id: `demo-progress-${Date.now()}`,
        user_id: profile.id,
        training_id: courseId,
        status: 'in_progress',
        progress_percentage: 0,
        score: null,
        started_at: new Date().toISOString(),
        completed_at: null,
      };
      setProgress([...progress, newProgress]);
      return { data: newProgress };
    }

    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .insert({
          user_id: profile.id,
          training_id: courseId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          error: mapSupabaseError('Erreur lors du demarrage du cours', error),
        };
      }

      setProgress([...progress, data]);
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur startCourse', error) };
    }
  };

  const updateProgress = async (
    courseId: string,
    progressPercentage: number,
  ) => {
    if (!profile) return { error: 'Utilisateur non connecte' };

    if (isDemo) {
      const updated = progress.map((p) =>
        p.training_id === courseId
          ? {
              ...p,
              progress_percentage: progressPercentage,
              status: (progressPercentage >= 100 ? 'completed' : 'in_progress') as UserTrainingProgress['status'],
              completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
            }
          : p,
      );
      setProgress(updated);
      return { data: updated.find((p) => p.training_id === courseId) };
    }

    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .update({
          progress_percentage: progressPercentage,
          status: progressPercentage >= 100 ? 'completed' : 'in_progress',
          completed_at:
            progressPercentage >= 100 ? new Date().toISOString() : null,
        })
        .eq('user_id', profile.id)
        .eq('training_id', courseId)
        .select()
        .single();

      if (error) {
        return {
          error: mapSupabaseError(
            'Erreur lors de la mise a jour de la progression',
            error,
          ),
        };
      }

      setProgress(progress.map((p) => (p.training_id === courseId ? data : p)));

      if (progressPercentage >= 100) {
        await updateProfileTrainingStats();
      }

      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur updateProgress', error) };
    }
  };

  const completeQuiz = async (courseId: string, score: number) => {
    if (!profile) return { error: 'Utilisateur non connecte' };

    const course = courses.find((c) => c.id === courseId);
    if (!course) return { error: 'Cours non trouve' };

    const passed = score >= 70;

    if (isDemo) {
      const updated = progress.map((p) =>
        p.training_id === courseId
          ? {
              ...p,
              score,
              status: (passed ? 'completed' : 'in_progress') as UserTrainingProgress['status'],
              progress_percentage: passed ? 100 : 80,
              completed_at: passed ? new Date().toISOString() : null,
            }
          : p,
      );
      setProgress(updated);
      return { data: updated.find((p) => p.training_id === courseId), passed };
    }

    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .update({
          score,
          status: passed ? 'completed' : 'in_progress',
          progress_percentage: passed ? 100 : 80,
          completed_at: passed ? new Date().toISOString() : null,
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

      setProgress(progress.map((p) => (p.training_id === courseId ? data : p)));

      if (passed) {
        await addXP(course.xp_reward);
      }

      return { data, passed };
    } catch (error) {
      return { error: mapSupabaseError('Erreur completeQuiz', error) };
    }
  };

  const updateProfileTrainingStats = async () => {
    if (!profile || isDemo) return;

    try {
      const completedCount = progress.filter(
        (p) => p.status === 'completed',
      ).length;

      await supabase
        .from('profiles')
        .update({
          completed_trainings: completedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
    } catch (error) {
      mapSupabaseError(
        'Erreur lors de la mise a jour des stats de formation',
        error,
      );
    }
  };

  const addXP = async (xpAmount: number) => {
    if (!profile || isDemo) return;

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

  return {
    courses,
    progress,
    loading,
    startCourse,
    updateProgress,
    completeQuiz,
    getCourseProgress,
    getCompletedCourses,
    getInProgressCourses,
    refetch: fetchTrainingData,
  };
}
