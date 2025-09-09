import { useEffect, useState } from 'react'
import { supabase, type TrainingCourse, type TrainingProgress } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTraining() {
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [progress, setProgress] = useState<TrainingProgress[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTrainingData()
    }
  }, [profile])

  const fetchTrainingData = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      
      // Récupérer les cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('training_courses')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (coursesError) {
        console.error('Erreur lors de la récupération des cours:', coursesError)
        return
      }

      setCourses(coursesData || [])

      // Récupérer la progression de l'utilisateur
      const { data: progressData, error: progressError } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', profile.id)

      if (progressError) {
        console.error('Erreur lors de la récupération de la progression:', progressError)
        return
      }

      setProgress(progressData || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCourse = async (courseId: string) => {
    if (!profile) return { error: 'Utilisateur non connecté' }

    try {
      // Vérifier si la progression existe déjà
      const existingProgress = progress.find(p => p.course_id === courseId)
      
      if (existingProgress) {
        return { data: existingProgress }
      }

      // Créer une nouvelle progression
      const { data, error } = await supabase
        .from('training_progress')
        .insert({
          user_id: profile.id,
          course_id: courseId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur lors du démarrage du cours:', error)
        return { error }
      }

      setProgress([...progress, data])
      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const updateProgress = async (courseId: string, progressPercentage: number) => {
    if (!profile) return { error: 'Utilisateur non connecté' }

    try {
      const { data, error } = await supabase
        .from('training_progress')
        .update({
          progress_percentage: progressPercentage,
          status: progressPercentage >= 100 ? 'completed' : 'in_progress',
          completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
        })
        .eq('user_id', profile.id)
        .eq('course_id', courseId)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la mise à jour de la progression:', error)
        return { error }
      }

      // Mettre à jour la liste locale
      setProgress(progress.map(p => 
        p.course_id === courseId ? data : p
      ))

      // Si le cours est terminé, mettre à jour les stats du profil
      if (progressPercentage >= 100) {
        await updateProfileTrainingStats()
      }

      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const completeQuiz = async (courseId: string, score: number) => {
    if (!profile) return { error: 'Utilisateur non connecté' }

    const course = courses.find(c => c.id === courseId)
    if (!course) return { error: 'Cours non trouvé' }

    const passed = score >= course.passing_score
    
    try {
      const { data, error } = await supabase
        .from('training_progress')
        .update({
          score,
          status: passed ? 'completed' : 'in_progress',
          progress_percentage: passed ? 100 : 80,
          completed_at: passed ? new Date().toISOString() : null,
        })
        .eq('user_id', profile.id)
        .eq('course_id', courseId)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la validation du quiz:', error)
        return { error }
      }

      setProgress(progress.map(p => 
        p.course_id === courseId ? data : p
      ))

      // Si réussi, ajouter les XP et vérifier les badges
      if (passed) {
        await addXP(course.xp_reward)
        await checkAchievements()
      }

      return { data, passed }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const updateProfileTrainingStats = async () => {
    if (!profile) return

    try {
      const completedCount = progress.filter(p => p.status === 'completed').length
      
      await supabase
        .from('profiles')
        .update({
          completed_trainings: completedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des stats de formation:', error)
    }
  }

  const addXP = async (xpAmount: number) => {
    if (!profile) return

    try {
      const newXP = profile.xp + xpAmount
      const newLevel = Math.floor(newXP / 100) + 1

      await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'XP:', error)
    }
  }

  const checkAchievements = async () => {
    if (!profile) return

    try {
      // Vérifier les badges basés sur les formations terminées
      const completedCount = progress.filter(p => p.status === 'completed').length

      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('condition_type', 'training_master')

      if (achievements) {
        for (const achievement of achievements) {
          const requiredCount = achievement.condition_value?.count || 1
          
          if (completedCount >= requiredCount) {
            // Vérifier si l'utilisateur a déjà ce badge
            const { data: existingBadge } = await supabase
              .from('user_achievements')
              .select('id')
              .eq('user_id', profile.id)
              .eq('achievement_id', achievement.id)
              .single()

            if (!existingBadge) {
              // Attribuer le badge
              await supabase
                .from('user_achievements')
                .insert({
                  user_id: profile.id,
                  achievement_id: achievement.id,
                })

              // Ajouter les XP du badge
              await addXP(achievement.xp_reward)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des badges:', error)
    }
  }

  const getCourseProgress = (courseId: string) => {
    return progress.find(p => p.course_id === courseId)
  }

  const getCompletedCourses = () => {
    return progress.filter(p => p.status === 'completed')
  }

  const getInProgressCourses = () => {
    return progress.filter(p => p.status === 'in_progress')
  }

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
  }
}