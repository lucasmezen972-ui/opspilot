import { useEffect, useState } from 'react';

import { useAuth } from './useAuth';
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
  const { profile, fetchProfile } = useAuth();

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTrainingData();
    }
  }, [profile?.organization_id, profile?.id]);

  const fetchTrainingData = async () => {
    if (!profile?.organization_id) return;

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

      setCourses(coursesData || []);

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

      setProgress(progressData || []);
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

      // Créer une nouvelle progression
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
          error: mapSupabaseError('Erreur lors du démarrage du cours', error),
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
    if (!profile) return { error: 'Utilisateur non connecté' };

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
            'Erreur lors de la mise à jour de la progression',
            error,
          ),
        };
      }

      // Mettre à jour la liste locale
      setProgress(progress.map((p) => (p.training_id === courseId ? data : p)));

      // Si le cours est terminé, mettre à jour les stats du profil
      if (progressPercentage >= 100) {
        await updateProfileTrainingStats();
      }

      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur updateProgress', error) };
    }
  };

  const completeQuiz = async (courseId: string, score: number) => {
    if (!profile) return { error: 'Utilisateur non connecté' };

    const course = courses.find((c) => c.id === courseId);
    if (!course) return { error: 'Cours non trouvé' };

    // Passing score is fixed at 70%
    const passed = score >= 70;

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

      // Si réussi, ajouter les XP
      if (passed) {
        await addXP(course.xp_reward);
      }

      return { data, passed };
    } catch (error) {
      return { error: mapSupabaseError('Erreur completeQuiz', error) };
    }
  };

  const updateProfileTrainingStats = async () => {
    if (!profile) return;

    try {
      const completedCount =
        progress.filter((p) => p.status === 'completed').length + 1;

      await supabase
        .from('profiles')
        .update({
          completed_trainings: completedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profile?.id) {
        await fetchProfile(profile.id);
      }
    } catch (error) {
      mapSupabaseError(
        'Erreur lors de la mise à jour des stats de formation',
        error,
      );
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
